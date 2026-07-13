import { describe, expect, it } from "vitest";

import { readAdminManagedUserRole } from "@/lib/server-staff-auth";

describe("admin-managed Clerk role metadata", () => {
  it("recognizes top-level and nested instructor roles", () => {
    expect(readAdminManagedUserRole({ publicMetadata: { role: "instructor" } })).toBe("instructor");
    expect(readAdminManagedUserRole({ publicMetadata: { staff: { role: "instructor" } } })).toBe("instructor");
  });

  it("fails safe when recognized role fields conflict by preserving any admin marker", () => {
    expect(
      readAdminManagedUserRole({
        publicMetadata: {
          role: "learner",
          staff: { role: "admin" },
        },
      }),
    ).toBe("admin");

    expect(
      readAdminManagedUserRole({
        publicMetadata: {
          role: "admin",
          staff: { role: "instructor" },
        },
      }),
    ).toBe("admin");
  });

  it("defaults malformed or missing role metadata to learner", () => {
    expect(readAdminManagedUserRole({ publicMetadata: {} })).toBe("learner");
    expect(readAdminManagedUserRole({ publicMetadata: { role: 123 } })).toBe("learner");
  });
});
