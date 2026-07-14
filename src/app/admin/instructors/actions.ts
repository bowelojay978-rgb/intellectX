"use server";

import {
  buildPublicMetadataWithStaffRole,
  getAdminClerkSession,
  readUserRole,
} from "@/lib/server-staff-auth";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

const recordInstructorAccessChangeAudit = makeFunctionReference<"mutation">(
  "staffSecurityAudit:recordInstructorAccessChange",
);
const reconcilePendingInstructorAccessChangeAudit = makeFunctionReference<"mutation">(
  "staffSecurityAudit:reconcilePendingInstructorAccessChange",
);

type ManagedInstructorRole = "learner" | "instructor";
type InstructorAccessFailureReason =
  | "clerk_metadata_update_failed"
  | "audit_completion_failed_rolled_back";

async function getAuthenticatedAdminConvexToken(expectedUserId: string) {
  const authState = await auth();

  if (authState.userId !== expectedUserId) {
    throw new Error("Unauthorized: authenticated admin session changed during role update.");
  }

  const token = await authState.getToken();
  if (!token) {
    throw new Error("Unable to obtain authenticated Convex token for staff security audit.");
  }

  return token;
}

async function writeInstructorAccessAudit(args: {
  token: string;
  operationId: string;
  phase: "requested" | "completed" | "failed";
  targetUserId: string;
  previousRole: ManagedInstructorRole;
  nextRole: ManagedInstructorRole;
  failureReason?: InstructorAccessFailureReason;
}) {
  const { token, ...mutationArgs } = args;
  await fetchMutation(recordInstructorAccessChangeAudit, mutationArgs, { token });
}

async function writeInstructorAccessAuditWithRetry(
  args: Parameters<typeof writeInstructorAccessAudit>[0],
) {
  try {
    await writeInstructorAccessAudit(args);
  } catch {
    await writeInstructorAccessAudit(args);
  }
}

async function reconcilePendingInstructorAccessChange(args: {
  token: string;
  targetUserId: string;
  currentRole: ManagedInstructorRole;
}) {
  const { token, ...mutationArgs } = args;
  await fetchMutation(reconcilePendingInstructorAccessChangeAudit, mutationArgs, { token });
}

export async function setInstructorAccessAction(formData: FormData) {
  const session = await getAdminClerkSession();
  if (!session) {
    throw new Error("Unauthorized: trusted admin role is required.");
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim();

  if (!userId) {
    throw new Error("A Clerk user ID is required.");
  }

  if (nextRole !== "instructor" && nextRole !== "learner") {
    throw new Error("Instructor management only supports learner or instructor roles.");
  }

  if (userId === session.userId) {
    throw new Error("Admins cannot change their own role from the instructor-management page.");
  }

  const client = await clerkClient();
  const targetUser = await client.users.getUser(userId);
  const currentRole = readUserRole(targetUser);

  if (currentRole === "admin") {
    throw new Error("Admin roles cannot be changed from the instructor-management page.");
  }

  const token = await getAuthenticatedAdminConvexToken(session.userId);

  if (currentRole === nextRole) {
    await reconcilePendingInstructorAccessChange({
      token,
      targetUserId: userId,
      currentRole,
    });
    revalidatePath("/admin/instructors");
    revalidatePath("/admin");
    return;
  }

  const operationId = randomUUID();
  const auditBase = {
    token,
    operationId,
    targetUserId: userId,
    previousRole: currentRole,
    nextRole,
  } as const;

  await writeInstructorAccessAudit({
    ...auditBase,
    phase: "requested",
  });

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: buildPublicMetadataWithStaffRole(targetUser.publicMetadata, nextRole),
    });
  } catch {
    try {
      await writeInstructorAccessAudit({
        ...auditBase,
        phase: "failed",
        failureReason: "clerk_metadata_update_failed",
      });
    } catch {
      // The requested audit event already persists the attempted transition.
    }

    throw new Error("Unable to update instructor access in Clerk.");
  }

  try {
    await writeInstructorAccessAuditWithRetry({
      ...auditBase,
      phase: "completed",
    });
  } catch {
    if (nextRole === "instructor") {
      try {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: buildPublicMetadataWithStaffRole(targetUser.publicMetadata, currentRole),
        });
      } catch {
        throw new Error(
          "Critical partial failure: instructor access was granted, audit completion failed, and rollback failed.",
        );
      }

      try {
        await writeInstructorAccessAudit({
          ...auditBase,
          phase: "failed",
          failureReason: "audit_completion_failed_rolled_back",
        });
      } catch {
        // The requested event still records the attempted privilege grant.
      }

      throw new Error("Instructor access grant was rolled back because security audit completion failed.");
    }

    throw new Error(
      "Instructor access was revoked, but security audit completion is pending reconciliation.",
    );
  }

  revalidatePath("/admin/instructors");
  revalidatePath("/admin");
}
