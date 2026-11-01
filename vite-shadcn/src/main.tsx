import App from '@/App';
import { bootstrapAuth } from '@/auth/service';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

/**
 * 配置 Cesium 资源路径
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).CESIUM_BASE_URL = import.meta.env.VITE_BASE || "/"; // 对应打包后的资源访问路径
function createRootElement() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
const mockEnable = import.meta.env.VITE_MOCK_ENABLE === 'true';
console.info(`[mock] ${mockEnable ? 'enabled' : 'disabled'}`);

async function start() {
  try {
    // 演示环境先启动 MSW，再恢复会话；MSW 只在需要时加载
    if (mockEnable) {
      const { default: initMSW } = await import('@/mock');
      await initMSW();
    }
    // 生产环境通过 refresh Cookie 恢复 access token
    await bootstrapAuth();
  } catch (error) {
    console.error(error);
  }
  createRootElement();
}

start();


