import type { IntlShape } from "react-intl";
import { z } from "zod";

export type TreeKind = "group" | "permission";

export type TreeCodeIssue =
  | { reason: "blank" }
  | { reason: "digits" }
  | { reason: "root-length"; expectedLength: number }
  | { reason: "length"; expectedLength: number }
  | { reason: "prefix"; parentId: string };

const POLICIES = {
  group: {
    rootLength: 2,
    segmentLength: 2,
    key: "groupCode",
    label: "组织编码",
  },
  permission: {
    rootLength: 4,
    segmentLength: 2,
    key: "permissionCode",
    label: "权限编码",
  },
} as const;

export function expectedCodeLength(
  kind: TreeKind,
  parentId?: string | null,
): number {
  const policy = POLICIES[kind];
  return parentId
    ? parentId.length + policy.segmentLength
    : policy.rootLength;
}

/**
 * Business Code 的唯一前端规则：根编码长度由类型决定，子编码 = 父编码 + 2 位数字。
 * 返回语义化 issue，由调用方决定文案（dialog 用 i18n，mock 用中文）。
 */
export function checkTreeCode(
  kind: TreeKind,
  id: string,
  parentId?: string | null,
): TreeCodeIssue | null {
  const policy = POLICIES[kind];
  const value = id ?? "";
  if (value.trim() === "") {
    return { reason: "blank" };
  }
  if (!/^\d+$/.test(value)) {
    return { reason: "digits" };
  }
  const parent = parentId?.trim() || null;
  if (parent === null) {
    return value.length === policy.rootLength
      ? null
      : { reason: "root-length", expectedLength: policy.rootLength };
  }
  const expectedLength = parent.length + policy.segmentLength;
  if (value.length !== expectedLength) {
    return { reason: "length", expectedLength };
  }
  if (!value.startsWith(parent)) {
    return { reason: "prefix", parentId: parent };
  }
  return null;
}

export function treeCodeIssueMessageKey(
  kind: TreeKind,
  issue: TreeCodeIssue,
): string {
  const key = POLICIES[kind].key;
  switch (issue.reason) {
    case "blank":
      return `validate.${key}.required`;
    case "digits":
      return `validate.${key}.digits`;
    case "root-length":
      return `validate.${key}.rootLength`;
    case "length":
      return `validate.${key}.length`;
    case "prefix":
      return `validate.${key}.prefix`;
  }
}

export function treeCodeIssueValues(
  issue: TreeCodeIssue,
): Record<string, string | number> | undefined {
  if (issue.reason === "root-length" || issue.reason === "length") {
    return { length: issue.expectedLength };
  }
  if (issue.reason === "prefix") {
    return { parentId: issue.parentId };
  }
  return undefined;
}

export function buildTreeCodeSchema(
  intl: IntlShape,
  kind: TreeKind,
  parentId?: string | null,
) {
  return z.string().superRefine((value, ctx) => {
    const issue = checkTreeCode(kind, value, parentId);
    if (!issue) {
      return;
    }
    ctx.addIssue({
      code: "custom",
      message: intl.formatMessage(
        { id: treeCodeIssueMessageKey(kind, issue) },
        treeCodeIssueValues(issue),
      ),
    });
  });
}

/** Mock 环境没有 i18n，使用与后端一致的中文文案。 */
export function treeCodeIssueZh(
  kind: TreeKind,
  issue: TreeCodeIssue,
): string {
  const label = POLICIES[kind].label;
  switch (issue.reason) {
    case "blank":
      return `${label}不能为空`;
    case "digits":
      return `${label}只能包含数字`;
    case "root-length":
      return `根${label}长度必须为${issue.expectedLength}`;
    case "length":
      return `${label}长度必须为${issue.expectedLength}`;
    case "prefix":
      return `${label}必须以${issue.parentId}开头`;
  }
}
