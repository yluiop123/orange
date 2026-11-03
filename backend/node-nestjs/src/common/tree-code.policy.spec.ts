import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BusinessException } from './business-exception';
import { TreeCodePolicy } from './tree-code.policy';
import { PermissionShapePolicy } from '../policies/permission-shape.policy';

interface Fixture {
  policy: {
    group: { rootLength: number; segmentLength: number };
    permission: { rootLength: number; segmentLength: number };
  };
  group: { valid: Array<{ id: string; parentId: string | null }>; invalid: Array<{ id: string; parentId: string | null }> };
  permission: {
    valid: Array<{ id: string; parentId: string | null }>;
    invalid: Array<{ id: string; parentId: string | null }>;
  };
  permissionShape: {
    valid: Array<{ type: string; action: string | null }>;
    invalid: Array<{ type: string; action: string | null }>;
  };
}

const fixture: Fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), '../../frontend/react/src/config/tree-code-policy.fixture.json'), 'utf8'),
);

function expectValid(policy: TreeCodePolicy, entries: Array<{ id: string; parentId: string | null }>) {
  for (const entry of entries) {
    expect(() => policy.validate(entry.id, entry.parentId)).not.toThrow();
  }
}

function expectInvalid(policy: TreeCodePolicy, entries: Array<{ id: string; parentId: string | null }>) {
  for (const entry of entries) {
    try {
      policy.validate(entry.id, entry.parentId);
      throw new Error(`expected ${JSON.stringify(entry)} to be rejected`);
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessException);
    }
  }
}

describe('TreeCodePolicy (shared fixture)', () => {
  it('matches the group root and segment lengths', () => {
    expect(TreeCodePolicy.GROUP.rootLength).toBe(fixture.policy.group.rootLength);
    expect(TreeCodePolicy.GROUP.segmentLength).toBe(fixture.policy.group.segmentLength);
  });

  it('matches the permission root and segment lengths', () => {
    expect(TreeCodePolicy.PERMISSION.rootLength).toBe(fixture.policy.permission.rootLength);
    expect(TreeCodePolicy.PERMISSION.segmentLength).toBe(fixture.policy.permission.segmentLength);
  });

  it('accepts and rejects the group fixture', () => {
    expectValid(TreeCodePolicy.GROUP, fixture.group.valid);
    expectInvalid(TreeCodePolicy.GROUP, fixture.group.invalid);
  });

  it('accepts and rejects the permission fixture', () => {
    expectValid(TreeCodePolicy.PERMISSION, fixture.permission.valid);
    expectInvalid(TreeCodePolicy.PERMISSION, fixture.permission.invalid);
  });

  it('ignores surrounding whitespace on the parent code', () => {
    expect(() => TreeCodePolicy.GROUP.validate('0001', ' 00 ')).not.toThrow();
  });
});

describe('PermissionShapePolicy (shared fixture)', () => {
  it('accepts every valid combination', () => {
    for (const entry of fixture.permissionShape.valid) {
      expect(() => PermissionShapePolicy.validate(entry.type, entry.action)).not.toThrow();
    }
  });

  it('rejects every invalid combination', () => {
    for (const entry of fixture.permissionShape.invalid) {
      expect(() => PermissionShapePolicy.validate(entry.type, entry.action)).toThrow(BusinessException);
    }
  });

  it('requires a non-blank action only for action permissions', () => {
    expect(() => PermissionShapePolicy.validate('action', '   ')).toThrow('action 类型的权限必须填写 action');
    expect(() => PermissionShapePolicy.validate('menu', 'add')).toThrow(
      'menu/directory 类型的权限不能填写 action',
    );
  });
});
