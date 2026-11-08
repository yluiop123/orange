import { resolveMenuName } from './menus.service';

describe('resolveMenuName', () => {
  const translations = new Map<string, string>([
    ['en-us', 'English (US)'],
    ['en', 'English'],
    ['zh-cn', '中文'],
  ]);

  it('prefers the exact locale, ignoring case', () => {
    expect(resolveMenuName('默认名称', translations, 'EN-US')).toBe('English (US)');
    expect(resolveMenuName('默认名称', translations, 'zh-CN')).toBe('中文');
  });

  it('falls back to the language part before the dash', () => {
    expect(resolveMenuName('默认名称', translations, 'en-GB')).toBe('English');
  });

  it('falls back to sys_permission.name when no translation matches', () => {
    expect(resolveMenuName('默认名称', translations, 'fr-FR')).toBe('默认名称');
    expect(resolveMenuName('默认名称', translations, 'de')).toBe('默认名称');
    expect(resolveMenuName('默认名称', translations, undefined)).toBe('默认名称');
    expect(resolveMenuName('默认名称', translations, '   ')).toBe('默认名称');
    expect(resolveMenuName('默认名称', new Map(), 'en-US')).toBe('默认名称');
  });

  it('ignores blank translation values', () => {
    const blank = new Map<string, string>([['en', '   ']]);
    expect(resolveMenuName('默认名称', blank, 'en-US')).toBe('默认名称');
  });
});
