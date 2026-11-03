/**
 * Business-code policy for organization and permission trees.
 *
 * Organization: root 2 digits, child = parent + 2 digits.
 * Permission:   root 4 digits, child = parent + 2 digits.
 * Codes are digits only and immutable; sibling order follows the code.
 */

export type TreeKind = 'group' | 'permission';

export type TreeCodeIssue =
  | { reason: 'blank' }
  | { reason: 'digits' }
  | { reason: 'root-length'; expectedLength: number }
  | { reason: 'length'; expectedLength: number }
  | { reason: 'prefix'; parentId: string };

const POLICIES: Record<TreeKind, { rootLength: number; segmentLength: number; key: string }> = {
  group: { rootLength: 2, segmentLength: 2, key: 'groupCode' },
  permission: { rootLength: 4, segmentLength: 2, key: 'permissionCode' },
};

export function expectedCodeLength(kind: TreeKind, parentId?: string | null): number {
  const policy = POLICIES[kind];
  return parentId ? parentId.length + policy.segmentLength : policy.rootLength;
}

export function checkTreeCode(
  kind: TreeKind,
  id: string,
  parentId?: string | null,
): TreeCodeIssue | null {
  const policy = POLICIES[kind];
  const value = id ?? '';
  if (value.trim() === '') {
    return { reason: 'blank' };
  }
  if (!/^\d+$/.test(value)) {
    return { reason: 'digits' };
  }
  const parent = parentId?.trim() || null;
  if (parent === null) {
    return value.length === policy.rootLength
      ? null
      : { reason: 'root-length', expectedLength: policy.rootLength };
  }
  const expectedLength = parent.length + policy.segmentLength;
  if (value.length !== expectedLength) {
    return { reason: 'length', expectedLength };
  }
  if (!value.startsWith(parent)) {
    return { reason: 'prefix', parentId: parent };
  }
  return null;
}

export function treeCodeIssueMessageKey(
  kind: TreeKind,
  issue: TreeCodeIssue,
): string {
  const key = POLICIES[kind].key;
  switch (issue.reason) {
    case 'blank':
      return `validate.${key}.required`;
    case 'digits':
      return `validate.${key}.digits`;
    case 'root-length':
      return `validate.${key}.rootLength`;
    case 'length':
      return `validate.${key}.length`;
    case 'prefix':
      return `validate.${key}.prefix`;
  }
}

export function treeCodeIssueValues(
  issue: TreeCodeIssue,
): Record<string, string | number> {
  if (issue.reason === 'root-length' || issue.reason === 'length') {
    return { length: issue.expectedLength };
  }
  if (issue.reason === 'prefix') {
    return { parentId: issue.parentId };
  }
  return {};
}
