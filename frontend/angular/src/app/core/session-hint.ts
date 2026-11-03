/** Non-sensitive hint that a refresh cookie *may* exist. No credentials. */
const KEY = 'orange.session';

export const sessionHint = {
  has(): boolean {
    return localStorage.getItem(KEY) === '1';
  },
  set(): void {
    localStorage.setItem(KEY, '1');
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
};
