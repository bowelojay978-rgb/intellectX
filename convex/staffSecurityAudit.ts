import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

import {
  assertManagedInstructorRoleTransition,
  getStaffRoleChangeAuditEventType,
} from "./lib/staffRoleChangeAudit";
import { requireAdmin } from "./lib/staffRbac";

const managedInstructorRoleValidator = v.union(v.literal("learner"), v.literal("instructor"));
const auditPhaseValidator = v.union(v.literal("requested"), v.literal("completed"), v.literal("failed"));

export const recordInstructorAccessChange = mutationGeneric({
  args: {
    operationId: v.string(),
    phase: auditPhaseValidator,
    targetUserId: v.string(),
    previousRole: managedInstructorRoleValidator,
    nextRole: managedInstructorRoleValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);

    assertManagedInstructorRoleTransition(args.previousRole, args.nextRole);

    const eventType = getStaffRoleChangeAuditEventType(args.phase, args.nextRole);
    const existingEvents = await ctx.db
      .query("auditLogs")
      .withIndex("by_operation_id", (q) => q.eq("operationId", args.operationId))
      .collect();
    const duplicateEvent = existingEvents.find((event) => event.eventType === eventType);

    if (duplicateEvent) {
      return duplicateEvent._id;
    }

    return await ctx.db.insert("auditLogs", {
      eventType,
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetType: "clerk_user",
      targetId: args.targetUserId,
      operationId: args.operationId,
      createdAt: Date.now(),
      reason: args.phase === "failed" ? "clerk_metadata_update_failed" : undefined,
      before: { role: args.previousRole },
      after: { role: args.nextRole },
    });
  },
});
