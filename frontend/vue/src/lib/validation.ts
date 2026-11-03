import type { ComposerTranslation } from 'vue-i18n'
import { checkTreeCode, treeCodeIssueMessageKey, treeCodeIssueValues, type TreeKind } from './tree-code-policy'

export function usernameRule(t: ComposerTranslation) {
  return (value: unknown) =>
    /^[A-Za-z0-9_]{4,50}$/.test(String(value ?? '')) ? null : t('validate.username')
}

export function nameRule(t: ComposerTranslation) {
  return (value: unknown) =>
    String(value ?? '').trim().length >= 2 ? null : t('validate.name')
}

export function roleNameRule(t: ComposerTranslation) {
  return (value: unknown) =>
    String(value ?? '').trim().length >= 2 ? null : t('validate.roleName')
}

export function groupNameRule(t: ComposerTranslation) {
  return (value: unknown) =>
    String(value ?? '').trim().length >= 2 ? null : t('validate.groupName')
}

export function emailRule(t: ComposerTranslation) {
  return (value: unknown) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '')) ? null : t('validate.email')
}

export function phoneRule(t: ComposerTranslation) {
  return (value: unknown) =>
    /^1[3-9]\d{9}$/.test(String(value ?? '')) ? null : t('validate.phone')
}

export function roleIdRule(t: ComposerTranslation) {
  return (value: unknown) =>
    /^[A-Za-z0-9_-]{2,32}$/.test(String(value ?? '')) ? null : t('validate.role')
}

export function permissionPathRule(t: ComposerTranslation) {
  return (value: unknown) =>
    /^[A-Za-z0-9/_:-]{2,200}$/.test(String(value ?? '')) ? null : t('validate.path')
}

export function requiredRule(t: ComposerTranslation) {
  return (value: unknown) => (String(value ?? '').trim() ? null : t('validate.required'))
}

export function treeCodeRule(
  t: ComposerTranslation,
  kind: TreeKind,
  parentId?: string | null,
) {
  return (value: unknown) => {
    const issue = checkTreeCode(kind, String(value ?? ''), parentId)
    if (!issue) return null
    return t(treeCodeIssueMessageKey(kind, issue), treeCodeIssueValues(issue) ?? {})
  }
}

export function permissionActionRule(t: ComposerTranslation) {
  return (value: unknown, values: Record<string, unknown>) => {
    const action = String(value ?? '').trim()
    const type = String(values.type ?? '')
    if (type === 'action') return action ? null : t('validate.permissionAction')
    return action ? t('validate.permissionAction') : null
  }
}
