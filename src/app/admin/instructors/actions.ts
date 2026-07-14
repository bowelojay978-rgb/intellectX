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

type ManagedInstructorRole = "learner" | "instructor";

async function writeInstructorAccessAudit(args: {
  token: string;
  operationId: string;
  phase: "requested" | "completed" | "failed";
  targetUserId: string;
  previousRole: ManagedInstructorRole;
  nextRole: ManagedInstructorRole;
}) {
  const { token, ...mutationArgs } = args;
  await fetchMutation(recordInstructorAccessChangeAudit, mutationArgs, { token });
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

  if (currentRole === nextRole) {
    revalidatePath("/admin/instructors");
    revalidatePath("/admin");
    return;
  }

  const authState = await auth();
  if (!authState.isAuthenticated || authState.userId !== session.userId) {
    throw new Error("Unauthorized: authenticated admin session changed during role update.");
  }

  const token = await authState.getToken();
  if (!token) {
    throw new Error("Unable to obtain authenticated Convex token for staff security audit.");
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
      });
    } catch {
      // The requested audit event already exists. Do not hide the Clerk mutation failure.
    }

    throw new Error("Unable to update instructor access in Clerk.");
  }

  try {
    await writeInstructorAccessAudit({
      ...auditBase,
      phase: "completed",
    });
  } catch {
    throw new Error("Instructor access was updated, but security audit completion failed.");
  }

  revalidatePath("/admin/instructors");
  revalidatePath("/admin");
}
