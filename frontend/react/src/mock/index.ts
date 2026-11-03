import { setupWorker } from "msw/browser";
import loginMenuHandlers from "./login/menu";
import loginUserHandlers from "./login/user";
import systemGroupHandlers from "./system/group";
import systemOperationLogHandlers from "./system/operation-log";
import systemPermissionHandlers from "./system/permission";
import systemRoleHandlers from "./system/role";
import systemUserHandlers from "./system/user";
const mockHandlers = [
  ...loginUserHandlers,
  ...loginMenuHandlers,
  ...systemUserHandlers,
  ...systemRoleHandlers,
  ...systemGroupHandlers,
  ...systemPermissionHandlers,
  ...systemOperationLogHandlers
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
    onUnhandledFrame: "bypass",
  });
  console.log('MSW worker started')
  return worker;
}
