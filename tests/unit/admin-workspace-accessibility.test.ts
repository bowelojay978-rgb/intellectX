import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  path.join(process.cwd(), "src/components/admin/admin-course-review-workspace.tsx"),
  "utf8",
);

describe("admin course review workspace accessibility contracts", () => {
  it("exposes search, filter, selection, loading, error, and success semantics", () => {
    expect(workspaceSource).toContain('aria-label="Search course, subject, or instructor"');
    expect(workspaceSource).toContain("aria-pressed={filter === value}");
    expect(workspaceSource).toContain("aria-pressed={selectedStableId === course.stableId}");
    expect(workspaceSource).toContain('role="alert"');
    expect(workspaceSource).toContain('role="status"');
    expect(workspaceSource).toContain('aria-live="polite"');
  });

  it("requires explicit confirmation before unpublish or archive reaches the action callback", () => {
    expect(workspaceSource).toContain('onClick={() => setConfirmingAction("unpublish")}');
    expect(workspaceSource).toContain('onClick={() => setConfirmingAction("archive")}');
    expect(workspaceSource).toContain('role="alertdialog"');
    expect(workspaceSource).toContain("onClick={confirmDestructiveAction}");
    expect(workspaceSource).not.toContain('onClick={() => onAction("unpublish")}');
    expect(workspaceSource).not.toContain('onClick={() => onAction("archive")}');
  });

  it("keeps approve, request changes, and publish as direct non-destructive actions", () => {
    expect(workspaceSource).toContain('onClick={() => onAction("approve")}');
    expect(workspaceSource).toContain('onClick={() => onAction("changes")}');
    expect(workspaceSource).toContain('onClick={() => onAction("publish")}');
  });
});
