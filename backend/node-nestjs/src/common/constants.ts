export const STATUS_ENABLE = '1';
export const STATUS_DISABLE = '0';
export const STATUS_ALL = 'all';

export const MENU_TYPES = ['menu', 'directory'];
export const PERMISSION_TYPES = ['menu', 'action', 'directory'];

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

/** Paths that stay reachable while `must_change_password` is true. */
export const ALLOWED_BEFORE_PASSWORD_CHANGE = [
  '/api/v1/auth/change-password',
  '/api/v1/auth/user-info',
  '/api/v1/auth/menus',
  '/api/v1/auth/logout',
];
