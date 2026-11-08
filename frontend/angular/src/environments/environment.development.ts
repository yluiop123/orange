export const environment = {
  production: false,
  /** Dev server proxies /api to http://127.0.0.1:8080 (see proxy.conf.json). */
  apiBase: '/api/v1',
  /** Demo data: on in development, off in production; `?mock=1` also enables it. */
  mock: true,
};
