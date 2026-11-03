import { useThemeStore } from '@/store/index';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Radio, ShieldAlert, Target, TriangleAlert, Zap } from 'lucide-react';
import React, { ReactNode, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Area, AreaChart, Line, LineChart, ResponsiveContainer } from 'recharts';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const TacticalPanel = ({ title, children, flex = "1" }: { title: string, children: ReactNode, flex?: string }) => (
  <section 
    className="flex flex-col min-h-0 min-w-0 border-2 transition-colors duration-300 bg-white border-slate-300 dark:bg-[#05080a] dark:border-emerald-900/40 relative"
    style={{ flex }}
  >
    <div className="hidden dark:block absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-10" />
    <div className="px-3 py-1 shrink-0 flex justify-between items-center border-b-2 bg-slate-100 border-slate-300 dark:bg-emerald-950/20 dark:border-emerald-900/40">
      <h2 className="text-[10px] font-bold tracking-[0.1em] text-slate-700 dark:text-emerald-400 flex items-center gap-2">
        <span className="w-1 h-3 bg-red-600 dark:bg-emerald-500 block"></span>
        {title}
      </h2>
    </div>
    <div className="flex-1 relative min-h-0 w-full overflow-hidden">
      {children}
    </div>
  </section>
);

export default function MissionControl() {
  const { mode } = useThemeStore(); 
  const [data] = React.useState(() => Array.from({ length: 30 }, (_, i) => ({ 
    time: i, 
    val: 30 + Math.random() * 50 
  })));

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col p-2 gap-2 box-border bg-[#eef0f2] text-slate-900 dark:bg-[#020405] dark:text-emerald-50">
      
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-2 rounded-sm bg-white border-slate-300 dark:bg-[#0a0f0d] dark:border-emerald-900/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Target className="text-red-600 dark:text-emerald-500" size={18} />
          <h1 className="font-bold tracking-[0.2em] text-sm">综合战术指挥平台</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-[10px] font-mono opacity-60">UPLINK_SECURE: 128-BIT</div>
          <div className={`flex items-center gap-2 px-3 py-1 border ${mode === 'dark' ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-slate-300'}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-bold">{mode === 'dark' ? '夜视' : '全彩'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-2 min-h-0 w-full overflow-hidden">
        {/* Left Side */}
        <aside className="w-1/5 flex flex-col gap-2 min-h-0 shrink-0">
          <TacticalPanel title="情报日志 (INTEL)" flex="2">
            <div className="p-0 font-sans text-[9px] overflow-y-auto h-full scrollbar-hide">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="p-2 border-b border-slate-200 dark:border-emerald-900/20 dark:text-emerald-500/80">
                  <span className="font-mono opacity-50 mr-2">14:0{i}</span>
                  节点 {100+i} 状态正常
                </div>
              ))}
            </div>
          </TacticalPanel>
          <TacticalPanel title="频谱监测 (SCAN)" flex="1.2">
            <div className="w-full h-full p-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <Area type="step" dataKey="val" stroke={mode === 'dark' ? "#10b981" : "#2563eb"} fill={mode === 'dark' ? "#10b981" : "#2563eb"} fillOpacity={0.1}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TacticalPanel>
        </aside>

        {/* Right Side */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0 overflow-hidden">
          <div className="flex-[2.5] flex gap-2 min-h-0 w-full">
            {/* 地图区域 - 修复遮罩挡住交互 */}
            <div className="flex-1 min-w-0 border-2 relative overflow-hidden bg-slate-900 border-slate-300 dark:border-emerald-900/60 shadow-inner">
              <MapContainer 
                center={[31.23, 121.47]} zoom={12} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <MapResizer />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              </MapContainer>
              
              {/* 地图UI覆盖层 - pointer-events-none 确保鼠标可点击地图 */}
              <div className="absolute inset-0 pointer-events-none z-[401] shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[401] opacity-30 pointer-events-none text-emerald-500">
                <Crosshair size={100} strokeWidth={0.5} />
              </div>
            </div>

            <div className="w-1/4 flex flex-col gap-2 min-h-0 shrink-0">
              <TacticalPanel title="资产监控" flex="1">
                <div className="grid grid-cols-2 p-2 gap-2 h-full">
                  {[Zap, ShieldAlert, Target, Radio].map((Icon, i) => (
                    <div key={i} className="flex flex-col items-center justify-center border bg-slate-50 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                       <Icon size={14} className="text-slate-500 dark:text-emerald-500" />
                       <span className="text-[8px] font-bold mt-1 opacity-60 uppercase">MOD-{i}</span>
                    </div>
                  ))}
                </div>
              </TacticalPanel>
/* --- 请替换原代码中对应的 TacticalPanel (矢量分析) 部分 --- */

              <TacticalPanel title="矢量分析 (VECTOR)" flex="1.5">
                <div className="w-full h-full p-2 box-border">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={data} 
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorVector" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      {/* 必须提供坐标轴组件，即使不显示，也要占用空间供图表计算 */}
                      <path d="M 0 0" stroke="none" fill="none" /> 
                      <Area 
                        type="stepAfter" 
                        dataKey="val" 
                        stroke="#ef4444" 
                        strokeWidth={1.5}
                        fill="url(#colorVector)" 
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  {/* 叠加一个动态数值层，增加“分析中”的视觉效果 */}
                  <div className="absolute top-8 right-3 text-[10px] font-mono text-red-500 text-right leading-tight pointer-events-none">
                    <div>TRK_ID: 8829</div>
                    <div>VEL: 422 m/s</div>
                    <div className="animate-pulse font-bold">CALCULATING...</div>
                  </div>
                </div>
              </TacticalPanel>
            </div>
          </div>

          <div className="flex-1 flex gap-2 min-h-0 w-full overflow-hidden">
            <TacticalPanel title="数据通量">
              <div className="w-full h-full p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="val" stroke={mode === 'dark' ? "#10b981" : "#2563eb"} dot={false} strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TacticalPanel>
            <TacticalPanel title="控制台 (CMD)">
              <div className="p-3 font-mono text-[9px] h-full text-slate-500 dark:text-emerald-500">
                <p>{">"} 系统自检完成</p>
                <p className="mt-1 text-red-500 animate-pulse font-bold underline italic">检测到 2 个外来频谱接入</p>
              </div>
            </TacticalPanel>
          </div>
        </div>
      </main>

      <footer className="h-6 shrink-0 flex items-center px-4 justify-between text-[9px] font-bold bg-slate-900 text-white dark:bg-emerald-600 dark:text-black">
        <div className="flex gap-4 tracking-widest uppercase">
          <span>COORDINATE_SYSTEM: WGS-84</span>
          <span className="opacity-70">DEFCON_3</span>
        </div>
        <TriangleAlert size={10} className="animate-pulse" />
      </footer>

      <style>{`
        /* 全局溢出控制，防止出现双滚动条 */
        html, body, #root { 
          margin: 0; padding: 0; overflow: hidden !important; 
          width: 100vw; height: 100vh;
        }

        /* 隐藏日志区域的系统滚动条 */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        /* 地图滤镜：仅对瓦片生效，不影响覆盖层 */
        .dark .leaflet-tile {
          filter: grayscale(1) invert(0.9) brightness(0.4) contrast(1.5) sepia(0.2) hue-rotate(90deg) !important;
        }
        
        .dark .leaflet-container {
          background: #010405 !important;
        }

        .leaflet-container { 
          width: 100% !important; 
          height: 100% !important; 
          z-index: 1;
        }

        /* 修正 Recharts 容器在 Flex 下的挤压问题 */
        .recharts-responsive-container { min-width: 0 !important; min-height: 0 !important; }
      `}</style>
    </div>
  );
}