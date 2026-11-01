import { setupWorker } from "msw/browser";
import loginUserHandlers from "./login/user";
import systemGroupHandlers from "./system/group";
import systemPermissionHandlers from "./system/permission";
import systemRoleHandlers from "./system/role";
import systemUserHandlers from "./system/user";
const mockHandlers = [
  ...loginUserHandlers,
  ...systemUserHandlers,
  ...systemRoleHandlers,
  ...systemGroupHandlers,
  ...systemPermissionHandlers
];
let worker: ReturnType<typeof setupWorker> | null = null;
export default async function initMSW() {
  if (worker) return worker;
  worker = setupWorker(...mockHandlers);
  // 注销旧 SW
  // const registrations = await navigator.serviceWorker.getRegistrations();
  // for (const reg of registrations) {
  //   await reg.unregister();
  // }

  // 启动 MSW
  await worker.start({
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      options: { type: 'module', updateViaCache: 'none' },
    },
    onUnhandledFrame({ frame, defaults }) {
      // 只对未匹配的 API 请求给出警告；页面、模块、静态资源交给 Vite/后端处理。
      const request = (frame as { data?: { request?: Request } }).data?.request;
      if (!request) return;
      const pathname = new URL(request.url).pathname;
      if (!pathname.startsWith("/api/")) return;
      defaults.warn();
    },
  });
  console.log('MSW worker started')
  return worker;
}
