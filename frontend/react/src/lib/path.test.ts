import { describe, expect, it } from "vitest";
import {
  isPathWithin,
  isSafeInternalPath,
  isSamePath,
  normalizePath,
} from "./path";

describe("normalizePath", () => {
  it("adds a leading slash and strips trailing slashes", () => {
    expect(normalizePath("system/user/")).toBe("/system/user");
    expect(normalizePath("/system/user///")).toBe("/system/user");
    expect(normalizePath("")).toBe("/");
  });
});

describe("isPathWithin", () => {
  it("matches the same path", () => {
    expect(isPathWithin("/system", "/system")).toBe(true);
    expect(isPathWithin("/system/", "/system")).toBe(true);
  });

  it("matches child paths with a boundary", () => {
    expect(isPathWithin("/system/user", "/system")).toBe(true);
  });

  it("does not match a bare prefix", () => {
    expect(isPathWithin("/sys", "/system")).toBe(false);
    expect(isPathWithin("/systemx", "/system")).toBe(false);
    expect(isPathWithin("/systematic/user", "/system")).toBe(false);
  });

  it("treats root as the parent of every path", () => {
    expect(isPathWithin("/anything", "/")).toBe(true);
  });

  it("returns false for an empty base", () => {
    expect(isPathWithin("/system", "")).toBe(false);
  });
});

describe("isSamePath", () => {
  it("ignores trailing slashes", () => {
    expect(isSamePath("/system/user/", "/system/user")).toBe(true);
    expect(isSamePath("/system/user", "/system/role")).toBe(false);
  });
});

describe("isSafeInternalPath", () => {
  it("accepts internal paths", () => {
    expect(isSafeInternalPath("/system/user?tab=1")).toBe(true);
  });

  it("rejects external or protocol-relative paths", () => {
    expect(isSafeInternalPath("https://example.com")).toBe(false);
    expect(isSafeInternalPath("//evil.example.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil")).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath(123)).toBe(false);
  });
});
