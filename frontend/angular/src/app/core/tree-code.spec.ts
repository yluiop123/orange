import { describe, expect, it } from 'vitest';
import { checkTreeCode, expectedCodeLength } from './tree-code';

describe('checkTreeCode', () => {
  it('accepts a two-digit group root and a four-digit permission root', () => {
    expect(checkTreeCode('group', '00', null)).toBeNull();
    expect(checkTreeCode('permission', '0000', null)).toBeNull();
  });

  it('rejects roots with the wrong length', () => {
    expect(checkTreeCode('group', '0', null)).toEqual({
      reason: 'root-length',
      expectedLength: 2,
    });
    expect(checkTreeCode('permission', '000', null)).toEqual({
      reason: 'root-length',
      expectedLength: 4,
    });
  });

  it('rejects blank and non-digit codes', () => {
    expect(checkTreeCode('group', '', null)).toEqual({ reason: 'blank' });
    expect(checkTreeCode('group', '   ', null)).toEqual({ reason: 'blank' });
    expect(checkTreeCode('group', '0A', null)).toEqual({ reason: 'digits' });
    expect(checkTreeCode('permission', '00-1', null)).toEqual({ reason: 'digits' });
  });

  it('requires children to be parent code plus two digits', () => {
    expect(checkTreeCode('group', '0001', '00')).toBeNull();
    expect(checkTreeCode('permission', '000001', '0000')).toBeNull();
    expect(checkTreeCode('group', '000', '00')).toEqual({
      reason: 'length',
      expectedLength: 4,
    });
    expect(checkTreeCode('permission', '0001', '0000')).toEqual({
      reason: 'length',
      expectedLength: 6,
    });
  });

  it('rejects a child that does not start with the parent code', () => {
    expect(checkTreeCode('group', '0101', '00')).toEqual({
      reason: 'prefix',
      parentId: '00',
    });
    expect(checkTreeCode('permission', '999901', '0000')).toEqual({
      reason: 'prefix',
      parentId: '0000',
    });
  });

  it('computes the expected length for a parent', () => {
    expect(expectedCodeLength('group')).toBe(2);
    expect(expectedCodeLength('group', '00')).toBe(4);
    expect(expectedCodeLength('permission')).toBe(4);
    expect(expectedCodeLength('permission', '0005')).toBe(6);
  });
});
