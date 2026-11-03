import { describe, expect, it } from 'vitest'
import { checkTreeCode, expectedCodeLength, treeCodeIssueMessageKey } from './tree-code-policy'

describe('checkTreeCode', () => {
  it('accepts a 2-digit root group and a 4-digit root permission', () => {
    expect(checkTreeCode('group', '00')).toBeNull()
    expect(checkTreeCode('permission', '0000')).toBeNull()
  })

  it('accepts a child whose code extends its parent by two digits', () => {
    expect(checkTreeCode('group', '0001', '00')).toBeNull()
    expect(checkTreeCode('permission', '000500', '0005')).toBeNull()
  })

  it('rejects blank, non-digit and wrong-length codes', () => {
    expect(checkTreeCode('group', '  ')).toEqual({ reason: 'blank' })
    expect(checkTreeCode('group', '0a')).toEqual({ reason: 'digits' })
    expect(checkTreeCode('group', '000')).toEqual({ reason: 'root-length', expectedLength: 2 })
    expect(checkTreeCode('permission', '0000', '0000')).toEqual({
      reason: 'length',
      expectedLength: 6,
    })
  })

  it('rejects a child that does not start with its parent', () => {
    expect(checkTreeCode('group', '0100', '00')).toEqual({ reason: 'prefix', parentId: '00' })
    expect(checkTreeCode('permission', '000600', '0005')).toEqual({
      reason: 'prefix',
      parentId: '0005',
    })
  })

  it('computes expected lengths from the parent', () => {
    expect(expectedCodeLength('group')).toBe(2)
    expect(expectedCodeLength('permission')).toBe(4)
    expect(expectedCodeLength('group', '0001')).toBe(6)
  })

  it('maps issues to translation keys', () => {
    expect(treeCodeIssueMessageKey('group', { reason: 'blank' })).toBe(
      'validate.groupCode.required',
    )
    expect(treeCodeIssueMessageKey('permission', { reason: 'root-length', expectedLength: 4 })).toBe(
      'validate.permissionCode.rootLength',
    )
  })
})
