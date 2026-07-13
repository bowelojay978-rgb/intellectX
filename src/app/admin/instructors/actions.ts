"use server";

import { getAdminClerkSession, readAdminManagedUserRole } from "@/lib/server-staff-auth";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
  const currentRole = readAdminManagedUserRole(targetUser);

  if (currentRole === "admin") {
    throw new Error("Admin roles cannot be changed from the instructor-management page.");
  }

  const currentPublicMetadata = targetUser.publicMetadata ?? {};
  const nestedStaff = currentPublicMetadata.staff;
  const nextPublicMetadata = {
    ...currentPublicMetadata,
    role: nextRole,
    ...(nestedStaff && typeof nestedStaff === "object" && !Array.isArray(nestedStaff)
      ? {
          staff: {
            ...(nestedStaff as Record<string, unknown>),
            role: nextRole,
          },
        }
      : {}),
  };

  await client.users.updateUserMetadata(userId, {
    publicMetadata: nextPublicMetadata,
  });

  revalidatePath("/admin/instructors");
  revalidatePath("/admin");
}
