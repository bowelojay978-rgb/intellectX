import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

import {
  assertManagedInstructorRoleTransition,
  getStaffRoleChangeAuditEventType,
  type ManagedInstructorRole,
} from "./lib/staffRoleChangeAudit";
import { requireAdmin } from "./lib/staffRbac";

const managedInstructorRoleValidator = v.union(v.literal("learner"), v.literal("instructor"));
const auditPhaseValidator = v.union(v.literal("requested"), v.literal("completed"), v.literal("failed"));
const failureReasonValidator = v.union(
  v.literal("clerk_metadata_update_failed"),
  v.literal("audit_completion_failed_rolled_back"),
);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readManagedRole(value: unknown): ManagedInstructorRole | null {
  return value === "learner" || value === "instructor" ? value : null;
}

function readOperationId(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function hasOperationId(event: { before?: unknown }, operationId: string) {
  return isRecord(event.before) && event.before.operationId === operationId;
}

export const recordInstructorAccessChange = mutationGeneric({
  args: {
    operationId: v.string(),
    phase: auditPhaseValidator,
    targetUserId: v.string(),
    previousRole: managedInstructorRoleValidator,
    nextRole: managedInstructorRoleValidator,
    failureReason: v.optional(failureReasonValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);

    assertManagedInstructorRoleTransition(args.previousRole, args.nextRole);

    const eventType = getStaffRoleChangeAuditEventType(args.phase, args.nextRole);
    const existingEvents = await ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) => q.eq("targetType", "clerk_user").eq("targetId", args.targetUserId))
      .order("desc")
      .take(20);
    const duplicateEvent = existingEvents.find(
      (event) => event.eventType === eventType && hasOperationId(event, args.operationId),
    );

    if (duplicateEvent) {
      return duplicateEvent._id;
    }

    return await ctx.db.insert("auditLogs", {
      eventType,
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetType: "clerk_user",
      targetId: args.targetUserId,
      createdAt: Date.now(),
      reason: args.phase === "failed" ? args.failureReason ?? "staff_role_change_failed" : undefined,
      before: { role: args.previousRole, operationId: args.operationId },
      after: { role: args.nextRole, operationId: args.operationId },
    });
  },
});

export const reconcilePendingInstructorAccessChange = mutationGeneric({
  args: {
    targetUserId: v.string(),
    currentRole: managedInstructorRoleValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const existingEvents = await ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) => q.eq("targetType", "clerk_user").eq("targetId", args.targetUserId))
      .order("desc")
      .take(50);

    for (const requestedEvent of existingEvents) {
      if (
        requestedEvent.eventType !== "staff_instructor_access_change_requested" ||
        !isRecord(requestedEvent.before) ||
        !isRecord(requestedEvent.after)
      ) {
        continue;
      }

      const operationId = readOperationId(requestedEvent.before.operationId);
      const previousRole = readManagedRole(requestedEvent.before.role);
      const requestedRole = readManagedRole(requestedEvent.after.role);

      if (!operationId || !previousRole || !requestedRole || requestedRole !== args.currentRole) {
        continue;
      }

      assertManagedInstructorRoleTransition(previousRole, requestedRole);

      const completedEventType = getStaffRoleChangeAuditEventType("completed", requestedRole);
      const hasTerminalEvent = existingEvents.some(
        (event) =>
          (event.eventType === completedEventType ||
            event.eventType === "staff_instructor_access_change_failed") &&
          hasOperationId(event, operationId),
      );

      if (hasTerminalEvent) {
        return { reconciled: false };
      }

      await ctx.db.insert("auditLogs", {
        eventType: completedEventType,
        actorUserId: actor.actorUserId,
        actorRole: actor.role,
        targetType: "clerk_user",
        targetId: args.targetUserId,
        createdAt: Date.now(),
        reason: "reconciled_after_clerk_role_change",
        before: { role: previousRole, operationId },
        after: { role: requestedRole, operationId },
      });

      return { reconciled: true };
    }

    return { reconciled: false };
  },
});
