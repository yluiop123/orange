import fixture from "@/config/tree-code-policy.fixture.json";
import { describe, expect, it } from "vitest";
import { checkPermissionShape } from "./permission-shape";

describe("permission shape policy", () => {
  it("accepts every valid type/action combination", () => {
    for (const entry of fixture.permissionShape.valid) {
      expect(
        checkPermissionShape(entry.type, entry.action),
        `${entry.type} + ${entry.action}`,
      ).toBeNull();
    }
  });

  it("rejects every invalid type/action combination", () => {
    for (const entry of fixture.permissionShape.invalid) {
      expect(
        checkPermissionShape(entry.type, entry.action),
        `${entry.type} + ${entry.action}`,
      ).toBe(entry.reason);
    }
  });

  it("treats whitespace-only actions as blank", () => {
    expect(checkPermissionShape("action", "   ")).toBe("action-required");
    expect(checkPermissionShape("menu", "  ")).toBeNull();
  });
});
