import { BusinessException } from './business-exception';

/**
 * Business-code rule for tree resources: root length is fixed by the resource,
 * a child is the parent code plus two digits, and codes never change.
 */
export class TreeCodePolicy {
  static readonly GROUP = new TreeCodePolicy(2, 2, '组织');
  static readonly PERMISSION = new TreeCodePolicy(4, 2, '权限');

  constructor(
    readonly rootLength: number,
    readonly segmentLength: number,
    readonly label: string,
  ) {}

  validate(id: string | null | undefined, parentId?: string | null): void {
    const code = (id ?? '').trim();
    if (code.length === 0) {
      throw BusinessException.validate(`${this.label}编码不能为空`);
    }
    if (!/^[0-9]+$/.test(code)) {
      throw BusinessException.validate(`${this.label}编码只能包含数字`);
    }
    const parent = trimToNull(parentId);
    if (parent === null) {
      if (code.length !== this.rootLength) {
        throw BusinessException.validate(`${this.label}编码长度必须为${this.rootLength}`);
      }
      return;
    }
    const expectedLength = parent.length + this.segmentLength;
    if (code.length !== expectedLength) {
      throw BusinessException.validate(`${this.label}编码长度必须为${expectedLength}`);
    }
    if (!code.startsWith(parent)) {
      throw BusinessException.validate(`${this.label}编码必须以${parent}开头`);
    }
  }
}

export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
