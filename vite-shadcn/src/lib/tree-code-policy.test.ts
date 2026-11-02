import { describe, expect, it } from "vitest";
import fixture from "@/config/tree-code-policy.fixture.json";
import {
  checkTreeCode,
  expectedCodeLength,
  type TreeKind,
} from "./tree-code-policy";

const KINDS: TreeKind[] = ["group", "permission"];

describe("Business Code policy", () => {
  it.each(KINDS)("exposes the same lengths as the fixture for %s", (kind) => {
    const policy = fixture.policy[kind];

    expect(expectedCodeLength(kind, null)).toBe(policy.rootLength);
    expect(expectedCodeLength(kind, "0".repeat(policy.rootLength))).toBe(
      policy.rootLength + policy.segmentLength,
    );
  });

  it.each(KINDS)("accepts every valid %s code", (kind) => {
    for (const entry of fixture[kind].valid) {
      expect(checkTreeCode(kind, entry.id, entry.parentId)).toBeNull();
    }
  });

  it.each(KINDS)("rejects every invalid %s code with the expected reason", (kind) => {
    for (const entry of fixture[kind].invalid) {
      expect(checkTreeCode(kind, entry.id, entry.parentId)).toMatchObject({
        reason: entry.reason,
      });
    }
  });
});
