import { Button } from "@/components/ui/button";
import { Float, Html, OrbitControls, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as d3 from 'd3-geo';
import {
  Activity,
  Crosshair,
  Database,
  Globe,
  Package, PhoneCall,
  ShieldAlert,
  SignalLow, Users,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import mapData from './data.json';
// 引入你的 store
import { useThemeStore } from "@/store/index";
// --- 1. 模拟数据 ---
const DISASTER_DATA = [
  { id: 1, name: "四川地震预警 (7.2级)", lon: 104.06, lat: 30.67, level: '核心' },
  { id: 2, name: "广东超强台风登陆", lon: 113.23, lat: 23.16, level: '预警' },
  { id: 3, name: "甘肃地质灾害风险", lon: 103.82, lat: 36.06, level: '提示' }
];
// --- 2. 3D 地图组件 ---
const ChinaMapScene: React.FC<{ mode: string }> = ({ mode }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const isDark = mode === 'dark';
  
  useEffect(() => {
      // 核心修改：改为读取本地 public 目录下的 data.json
      // 这种方式不依赖阿里云接口，海外部署也能秒开
      setGeoData(mapData)
      // fetch('/data.json')
      //   .then(res => {
      //     if (!res.ok) throw new Error('地图文件加载失败，请确认文件是否存在于 public 目录');
      //     return res.json();
      //   })
      //   .then(data => setGeoData(data))
      //   .catch(err => console.error("数据加载错误:", err));
    }, []);

  const projection = useMemo(() => {
    return d3.geoMercator().center([104.1954, 35.8617]).scale(4.5).translate([0, 0]);
  }, []);

  const mapShapes = useMemo(() => {
    if (!geoData) return [];
    const shapes: THREE.Shape[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoData.features.forEach((feature: any) => {
      const { coordinates, type } = feature.geometry;
      const processCoords = (coords: [number, number][]) => {
        const points = coords.map(coord => {
          const projected = projection(coord);
          return new THREE.Vector2(projected![0], -projected![1]);
        });
        shapes.push(new THREE.Shape(points));
      };
      if (type === "Polygon") processCoords(coordinates[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if (type === "MultiPolygon") coordinates.forEach((poly: any) => processCoords(poly[0]));
    });
    return shapes;
  }, [geoData, projection]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      {mapShapes.map((shape, i) => (
        <mesh key={i}>
          <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial 
            color={isDark ? "#0f172a" : "#f1f5f9"} 
            emissive={isDark ? "#38bdf8" : "#3b82f6"}
            emissiveIntensity={isDark ? 0.2 : 0.05}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {DISASTER_DATA.map((point) => {
        const projected = projection([point.lon, point.lat]);
        if (!projected) return null;
        const [x, y] = projected;
        return (
          <group key={point.id} position={[x, -y, 0.2]}>
            <mesh>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color={point.level === '核心' ? '#ef4444' : '#f59e0b'} />
            </mesh>
            <Html distanceFactor={10} position={[0.1, 0, 0]}>
              <div className={`flex items-center gap-2 whitespace-nowrap border p-2 rounded backdrop-blur-md shadow-lg
                ${isDark ? 'bg-black/80 border-white/20 text-white' : 'bg-white/80 border-slate-200 text-slate-900'}`}>
                <span className={`w-2 h-2 rounded-full animate-ping ${point.level === '核心' ? 'bg-red-500' : 'bg-orange-400'}`} />
                <span className="text-[10px] font-bold tracking-wider">{point.name}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// --- 3. 主指挥中心界面 ---
const DisasterCommandCenter = () => {
  const { mode } = useThemeStore();
  const [activePanel, setActivePanel] = useState<'rescue' | 'supplies' | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const isDark = mode === 'dark';

  return (
    <div className={`absolute inset-0 transition-colors duration-700 overflow-hidden font-sans
      ${isDark ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* 3D 渲染层 */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 6, 8], fov: 40 }}>
          <color attach="background" args={[isDark ? '#020617' : '#f8fafc']} />
          <ambientLight intensity={isDark ? 0.5 : 0.8} />
          <pointLight position={[10, 10, 10]} intensity={isDark ? 2 : 1} />
          {isDark && <Stars radius={100} depth={50} count={5000} factor={4} fade />}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <ChinaMapScene mode={mode} />
          </Float>
          <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} />
          <EffectComposer>
            <Bloom luminanceThreshold={isDark ? 0.2 : 0.8} intensity={isDark ? 1.5 : 0.5} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* 扫视线背景 (仅暗黑模式增强质感) */}
      {isDark && <div className="absolute inset-0 pointer-events-none opacity-20 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />}

      {/* 顶部栏 */}
      <header className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className={`flex items-center gap-4 border p-4 rounded-xl backdrop-blur-md pointer-events-auto shadow-xl
          ${isDark ? 'bg-slate-950/80 border-blue-500/30' : 'bg-white/80 border-slate-200'}`}>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <ShieldAlert className="text-blue-500 w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-[0.2em] italic ${isDark ? 'text-white' : 'text-slate-800'}`}>
              国家应急管理调度中心
            </h1>
            <div className="flex items-center gap-4 mt-1 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><Globe size={12}/> 卫星链路：已连接</span>
              <span className={`flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <Activity size={12}/> 安全等级：极高
              </span>
            </div>
          </div>
        </div>
        
        <div className={`border p-4 rounded-xl pointer-events-auto text-right backdrop-blur-md shadow-lg
          ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">核心计算负载</div>
           <div className={`text-2xl font-mono font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>42.08 FLOPS</div>
        </div>
      </header>

      {/* 侧边信息面板 */}
      <aside className="absolute right-8 top-1/2 -translate-y-1/2 w-[400px] z-30 pointer-events-none">
        {activePanel && (
          <div className={`pointer-events-auto border rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in slide-in-from-right-12 fade-in duration-500
            ${isDark ? 'bg-slate-950/90 border-blue-500/40' : 'bg-white/95 border-slate-200'}`}>
            
            <div className="px-6 py-5 border-b border-slate-200/10 flex justify-between items-center bg-blue-500/5">
              <div className="flex items-center gap-3">
                <Database className="text-blue-500" size={20} />
                <h2 className={`font-bold tracking-widest text-sm ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
                  {activePanel === 'rescue' ? '现场救援资源矩阵' : '战略物资储备同步'}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanel(null)}
                className="size-8 text-slate-400 hover:bg-transparent hover:text-red-500"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '在编人员', value: '1,420', unit: '人', color: isDark ? 'text-blue-400' : 'text-blue-600' },
                  { label: '机动设备', value: '84', unit: '台', color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                  { label: '预计到达', value: '45', unit: '分钟', color: 'text-orange-500' },
                  { label: '通信质量', value: '98', unit: '%', color: isDark ? 'text-blue-400' : 'text-blue-600' },
                ].map((stat, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[11px] text-slate-500 font-bold mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-mono font-black ${stat.color}`}>{stat.value}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">实时任务指令记录</span>
                  <span className={`text-[10px] font-mono animate-pulse ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>● 实时同步</span>
                </div>
                <div className={`rounded-xl p-4 border h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 scrollbar-thin
                  ${isDark ? 'bg-black/50 border-white/5' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <p><span className="text-blue-500">[14:02]</span> 系统初始化：四川灾区地形拓扑完成。</p>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    <span className="text-blue-500">[14:05]</span> <span className="text-orange-500">警告：</span>北斗链路波动。
                  </p>
                  <p><span className="text-blue-500">[14:08]</span> 无人机搜救分队 B-02 进入目标区域。</p>
                  <p><span className="text-blue-500">[14:15]</span> 自动评估：物资短缺口已锁定。</p>
                </div>
              </div>

              <Button className="w-full h-auto bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg">
                <Crosshair size={16} /> 下达全域同步指令
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* 底部控制中心 */}
      <footer className="absolute bottom-0 inset-x-0 p-8 flex justify-between items-end z-20 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-6">
          <div className={`p-5 rounded-2xl border backdrop-blur-md w-80 shadow-xl
            ${isDark ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest">安全疏散完成率</span>
              <span className={`text-sm font-mono font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>88.42%</span>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 w-[88%]" />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={() => setActivePanel(activePanel === 'rescue' ? null : 'rescue')}
            className={`p-6 h-auto rounded-full transition-all shadow-2xl border ${activePanel === 'rescue' ? 'bg-blue-600 border-white text-white hover:bg-blue-600 hover:text-white' : (isDark ? 'bg-slate-900 border-white/10 text-blue-400 hover:bg-slate-900 hover:text-blue-400' : 'bg-white border-slate-200 text-blue-600 hover:bg-white hover:text-blue-600')}`}
          >
            <Users size={32} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(activePanel === 'supplies' ? null : 'supplies')}
            className={`p-6 h-auto rounded-full transition-all shadow-2xl border ${activePanel === 'supplies' ? 'bg-emerald-600 border-white text-white hover:bg-emerald-600 hover:text-white' : (isDark ? 'bg-slate-900 border-white/10 text-emerald-400 hover:bg-slate-900 hover:text-emerald-400' : 'bg-white border-slate-200 text-emerald-600 hover:bg-white hover:text-emerald-600')}`}
          >
            <Package size={32} />
          </Button>
          <Button
            onClick={() => setIsCalling(true)}
            className="p-6 h-auto bg-red-600 text-white rounded-full animate-pulse shadow-xl border border-white/20 hover:bg-red-600"
          >
            <PhoneCall size={32} />
          </Button>
        </div>
      </footer>

      {/* 紧急呼叫 Overlay */}
      {isCalling && (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-500 text-white">
          <div className="text-center p-12 border border-white/10 rounded-[4rem] bg-slate-900/50 max-w-md w-full">
            <SignalLow className="text-red-500 w-16 h-16 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-2 italic">优先级：最高</h2>
            <p className="text-slate-500 font-mono text-xs mb-10 uppercase tracking-widest">正在建立卫星加密连接...</p>
            <Button onClick={() => setIsCalling(false)} className="w-full h-auto py-6 bg-red-600 text-white font-black rounded-2xl hover:bg-red-600">强制中断</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterCommandCenter;