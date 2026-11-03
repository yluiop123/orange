import { likeContains, likePrefix, splitIds } from './query.util';

describe('LIKE helpers', () => {
  it('keeps a plain prefix lower-cased', () => {
    expect(likePrefix('Smoke')).toBe('smoke%');
  });

  it('escapes the wildcards with the shared escape character', () => {
    expect(likePrefix('a_b%c!d')).toBe('a!_b!%c!!d%');
  });

  it('does not escape backslashes (literal on every engine)', () => {
    expect(likePrefix('C:\\temp')).toBe('c:\\temp%');
  });

  it('wraps contains patterns', () => {
    expect(likeContains('/System/Users')).toBe('%/system/users%');
    expect(likeContains('a_b')).toBe('%a!_b%');
  });

  it('treats null and undefined as an empty match-all prefix', () => {
    expect(likePrefix(undefined)).toBe('%');
    expect(likeContains(null)).toBe('%%');
  });
});

describe('splitIds', () => {
  it('trims and drops empty entries', () => {
    expect(splitIds(' a, b ,,c ')).toEqual(['a', 'b', 'c']);
    expect(splitIds(undefined)).toEqual([]);
  });
});
