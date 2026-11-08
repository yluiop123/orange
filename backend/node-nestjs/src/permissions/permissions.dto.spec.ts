import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddChildPermissionDto, EditPermissionDto } from './permissions.dto';

const BASE = { id: '0001', name: '系统管理', path: '/system', type: 'directory' };

async function invalidFields<T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(type, payload));
  return errors.map((error) => error.property);
}

describe('permission translation validation', () => {
  it('accepts well-formed locale keys and non-empty names', async () => {
    expect(
      await invalidFields(AddChildPermissionDto, {
        ...BASE,
        translations: { en: 'System', 'en-US': 'System (US)', 'zh-CN': '系统' },
      }),
    ).toEqual([]);
  });

  it('accepts an omitted translations field', async () => {
    expect(await invalidFields(AddChildPermissionDto, BASE)).toEqual([]);
    expect(await invalidFields(EditPermissionDto, { name: '系统' })).toEqual([]);
  });

  it('rejects malformed locale keys', async () => {
    for (const translations of [
      { english: 'System' },
      { 'e': 'System' },
      { 'en-USA': 'System' },
      { 'EN': 'System' },
      { 'en_US': 'System' },
    ]) {
      expect(await invalidFields(AddChildPermissionDto, { ...BASE, translations })).toContain(
        'translations',
      );
    }
  });

  it('rejects blank, non-string and over-long names', async () => {
    for (const translations of [
      { en: '' },
      { en: '   ' },
      { en: 42 },
      { en: null },
      { en: 'a'.repeat(256) },
    ]) {
      expect(await invalidFields(AddChildPermissionDto, { ...BASE, translations })).toContain(
        'translations',
      );
    }
  });

  it('rejects arrays and null payloads', async () => {
    expect(
      await invalidFields(AddChildPermissionDto, { ...BASE, translations: [] }),
    ).toContain('translations');
    expect(
      await invalidFields(AddChildPermissionDto, { ...BASE, translations: null }),
    ).toEqual([]);
  });

  it('applies the same validation to edit requests', async () => {
    expect(
      await invalidFields(EditPermissionDto, { translations: { 'en-US': 'System' } }),
    ).toEqual([]);
    expect(
      await invalidFields(EditPermissionDto, { translations: { 'en-us': 'System' } }),
    ).toEqual([]);
    expect(
      await invalidFields(EditPermissionDto, { translations: { 'en_US': 'System' } }),
    ).toContain('translations');
  });
});
