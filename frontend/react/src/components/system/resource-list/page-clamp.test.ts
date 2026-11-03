import { describe, expect, it } from "vitest";
import { clampPageAfterDelete } from "./page-clamp";

describe("clampPageAfterDelete", () => {
  it("keeps the current page when it still has rows", () => {
    expect(clampPageAfterDelete(30, 1, 10, 2)).toBe(2);
  });

  it("moves to the new last page when the current page disappears", () => {
    expect(clampPageAfterDelete(21, 1, 10, 3)).toBe(2);
  });

  it("never goes below page one", () => {
    expect(clampPageAfterDelete(1, 1, 10, 1)).toBe(1);
    expect(clampPageAfterDelete(0, 2, 10, 3)).toBe(1);
  });
});
