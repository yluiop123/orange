export type TreeKind = 'group' | 'permission'

export type TreeCodeIssue =
  | { reason: 'blank' }
  | { reason: 'digits' }
  | { reason: 'root-length'; expectedLength: number }
  | { reason: 'length'; expectedLength: number }
  | { reason: 'prefix'; parentId: string }

const POLICIES = {
  group: { rootLength: 2, segmentLength: 2, key: 'groupCode' },
  permission: { rootLength: 4, segmentLength: 2, key: 'permissionCode' },
} as const

export function expectedCodeLength(kind: TreeKind, parentId?: string | null): number {
  const policy = POLICIES[kind]
  return parentId ? parentId.length + policy.segmentLength : policy.rootLength
}

/**
 * Business-code rule shared by the dialogs and tests:
 * root length depends on the kind, child = parent + 2 digits.
 */
export function checkTreeCode(
  kind: TreeKind,
  id: string,
  parentId?: string | null,
): TreeCodeIssue | null {
  const policy = POLICIES[kind]
  const value = id ?? ''
  if (value.trim() === '') return { reason: 'blank' }
  if (!/^\d+$/.test(value)) return { reason: 'digits' }

  const parent = parentId?.trim() || null
  if (parent === null) {
    return value.length === policy.rootLength
      ? null
      : { reason: 'root-length', expectedLength: policy.rootLength }
  }

  const expectedLength = parent.length + policy.segmentLength
  if (value.length !== expectedLength) return { reason: 'length', expectedLength }
  if (!value.startsWith(parent)) return { reason: 'prefix', parentId: parent }
  return null
}

/** i18n message key for an issue; the caller supplies the translation. */
export function treeCodeIssueMessageKey(kind: TreeKind, issue: TreeCodeIssue): string {
  const key = POLICIES[kind].key
  switch (issue.reason) {
    case 'blank':
      return `validate.${key}.required`
    case 'digits':
      return `validate.${key}.digits`
    case 'root-length':
      return `validate.${key}.rootLength`
    case 'length':
      return `validate.${key}.length`
    case 'prefix':
      return `validate.${key}.prefix`
  }
}

export function treeCodeIssueValues(
  issue: TreeCodeIssue,
): Record<string, string | number> | undefined {
  if (issue.reason === 'root-length' || issue.reason === 'length') {
    return { length: issue.expectedLength }
  }
  if (issue.reason === 'prefix') return { parentId: issue.parentId }
  return undefined
}
