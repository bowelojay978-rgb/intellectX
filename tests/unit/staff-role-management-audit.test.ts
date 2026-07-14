import { describe, expect, it } from "vitest";

import {
  buildPrivateMetadataWithStaffRoleAudit,
  buildPublicMetadataWithStaffRole,
  buildStaffRoleAuditEntry,
  readUserRole,
} from "@/lib/server-staff-auth";

describe("staff role management audit metadata", () => {
  it("preserves canonical public staff.role when granting instructor access", () => {
    expect(
      buildPublicMetadataWithStaffRole(
        {
          role: "learner",
          staff: { role: "learner", department: "science" },
          theme: "dark",
        },
        "instructor",
      ),
    ).toEqual({
      role: "instructor",
      staff: { role: "instructor", department: "science" },
      theme: "dark",
    });
  });

  it("reads nested staff.role before legacy publicMetadata.role", () => {
    expect(
      readUserRole({
        publicMetadata: {
          role: "admin",
          staff: { role: "learner" },
        },
      }),
    ).toBe("learner");
  });

  it("builds bounded private audit entries for staff role grants and revocations", () => {
    const entry = buildStaffRoleAuditEntry({
      actorUserId: "admin_123",
      targetUserId: "user_456",
      previousRole: "learner",
      nextRole: "instructor",
      changedAt: 12345,
    });

    expect(entry).toEqual({
      eventType: "staff_role_changed",
      actorUserId: "admin_123",
      targetUserId: "user_456",
      previousRole: "learner",
      nextRole: "instructor",
      changedAt: 12345,
    });

    const metadata = buildPrivateMetadataWithStaffRoleAudit(
      {
        staffRoleAudit: [
          {
            eventType: "staff_role_changed",
            actorUserId: "admin_old",
            targetUserId: "user_456",
            previousRole: "instructor",
            nextRole: "learner",
            changedAt: 12000,
          },
        ],
        preserved: true,
      },
      entry,
    );

    expect(metadata).toEqual({
      preserved: true,
      staffRoleAudit: [
        entry,
        {
          eventType: "staff_role_changed",
          actorUserId: "admin_old",
          targetUserId: "user_456",
          previousRole: "instructor",
          nextRole: "learner",
          changedAt: 12000,
        },
      ],
    });
  });

  it("filters malformed prior audit entries and caps retained history", () => {
    const priorEntries = Array.from({ length: 30 }, (_, index) => ({
      eventType: "staff_role_changed" as const,
      actorUserId: `admin_${index}`,
      targetUserId: "user_456",
      previousRole: "learner" as const,
      nextRole: "instructor" as const,
      changedAt: index,
    }));

    const metadata = buildPrivateMetadataWithStaffRoleAudit(
      {
        staffRoleAudit: [
          { eventType: "staff_role_changed", actorUserId: null },
          ...priorEntries,
        ],
      },
      buildStaffRoleAuditEntry({
        actorUserId: "admin_new",
        targetUserId: "user_456",
        previousRole: "learner",
        nextRole: "instructor",
        changedAt: 999,
      }),
    );

    expect((metadata.staffRoleAudit as unknown[])).toHaveLength(25);
    expect((metadata.staffRoleAudit as Array<{ actorUserId: string }>)[0]?.actorUserId).toBe("admin_new");
    expect((metadata.staffRoleAudit as Array<{ actorUserId: string }>).some((entry) => entry.actorUserId === "admin_0")).toBe(false);
  });
});
