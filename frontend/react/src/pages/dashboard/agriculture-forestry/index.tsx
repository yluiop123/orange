import { useThemeStore } from '@/store/index';
import { Button } from "@/components/ui/button";
import { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import L, { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/fixLeafletIcon';
import {
  Activity,
  CloudRain,
  Droplets,
  Flame,
  Layers,
  LucideIcon,
  Map as MapIcon,
  Sprout,
  Sun,
  Wind
} from 'lucide-react';
import React, { ReactNode, useEffect } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';

// --- 1. 类型定义 ---
interface ForestProperties {
  name: string;
  health: number;
  type: string;
  carbon: number;
}

interface EcoPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  flex?: string;
}

// --- 2. 模拟林区地理数据 (GeoJSON) ---
const FOREST_CORE_DATA: FeatureCollection<Polygon, ForestProperties> = {
  type: "FeatureCollection",
  features: [
    { 
      type: "Feature", 
      properties: { name: "大竹海 011 号林班", health: 0.96, type: "成熟毛竹林", carbon: 120 }, 
      geometry: { type: "Polygon", coordinates: [[[119.590, 30.475], [119.610, 30.475], [119.615, 30.485], [119.595, 30.485], [119.590, 30.475]]] } 
    },
    { 
      type: "Feature", 
      properties: { name: "龙王山西侧缓冲带", health: 0.82, type: "针叶林", carbon: 85 }, 
      geometry: { type: "Polygon", coordinates: [[[119.575, 30.480], [119.585, 30.480], [119.588, 30.490], [119.578, 30.490], [119.575, 30.480]]] } 
    },
    { 
      type: "Feature", 
      properties: { name: "高海拔白茶园", health: 0.74, type: "白茶/果树", carbon: 45 }, 
      geometry: { type: "Polygon", coordinates: [[[119.600, 30.492], [119.615, 30.492], [119.612, 30.500], [119.602, 30.500], [119.600, 30.492]]] } 
    }
  ]
};

// --- 3. 子组件 ---
const EcoPanel: React.FC<EcoPanelProps> = ({ title, children, className = "", icon: Icon, flex = "none" }) => (
  <section 
    style={{ flex: flex }}
    className={`flex flex-col min-h-0 min-w-0 border bg-white dark:bg-[#060a08] border-green-100 dark:border-emerald-900/30 rounded-xl overflow-hidden shadow-sm ${className}`}
  >
    <div className="px-3 py-2.5 shrink-0 border-b bg-green-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-emerald-600 dark:text-emerald-500" />}
        <h2 className="text-[11px] font-bold tracking-widest text-emerald-900 dark:text-emerald-400 uppercase">
          {title}
        </h2>
      </div>
      <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
    </div>
    <div className="flex-1 relative min-h-0 w-full overflow-hidden">
      {children}
    </div>
  </section>
);

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// --- 4. 主组件 ---
export default function EcoManagement() {
  const { mode } = useThemeStore(); 
  const [ecoData] = React.useState(() => Array.from({ length: 24 }, (_, i) => ({ 
    hour: `${i}:00`, 
    val: 60 + Math.random() * 30
  })));

  // 自定义传感器图标
  const sensorIcon = L.divIcon({
    className: 'custom-sensor-icon',
    html: `<div style="background: #fbbf24; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #fbbf24;"></div>`,
    iconSize: [14, 14]
  });

  // 样式处理函数 - 解决 Geometry 兼容性报错的关键
  const plotStyle = (feature?: Feature<Geometry, ForestProperties>): PathOptions => {
    const defaultStyle: PathOptions = {
      weight: 2,
      opacity: 0.8,
      color: '#ecfdf5',
      fillOpacity: mode === 'dark' ? 0.3 : 0.45,
      fillColor: '#059669',
    };

    if (feature?.properties) {
      return {
        ...defaultStyle,
        fillColor: feature.properties.health > 0.9 ? '#064e3b' : '#10b981',
      };
    }
    return defaultStyle;
  };

  return (
    <div className="h-full w-full flex flex-col p-4 gap-4 box-border overflow-hidden bg-[#f0f4f2] dark:bg-[#010402] font-sans">
      
      {/* 顶部状态栏 */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border bg-white dark:bg-[#0a0f0d] dark:border-emerald-900/60 shadow-md rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-emerald-600 to-green-800 rounded-xl">
            <Sprout className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg text-emerald-950 dark:text-emerald-400 leading-tight">
              农林业管理系统
            </h1>
            <div className="flex gap-3 text-[10px] font-bold text-emerald-600/60">
              <span className="flex items-center gap-1"><MapIcon size={10}/> 30.485°N, 119.595°E</span>
              <span className="flex items-center gap-1"><CloudRain size={10}/> 实时海拔: 425m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-bold text-rose-500 flex items-center justify-end gap-1 uppercase">
               <Flame size={12}/> 森林火险：二级 (低)
            </div>
            <div className="text-[10px] text-gray-400 font-mono">NODE_STATUS: ACTIVE</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-4 min-h-0 w-full overflow-hidden">
        
        {/* 左侧面板 */}
        <aside className="w-[300px] flex flex-col gap-4 shrink-0 h-full">
          <EcoPanel title="林区环境参数" icon={CloudRain} className="h-56">
            <div className="grid grid-cols-2 p-4 gap-3">
              {[
                { label: '土壤湿度', val: '32', unit: '%', icon: Droplets, color: 'text-blue-500' },
                { label: '光合辐射', val: '1240', unit: 'μmol', icon: Sun, color: 'text-amber-500' },
                { label: '负氧离子', val: '8.4k', unit: 'ion', icon: Activity, color: 'text-emerald-500' },
                { label: '平均风速', val: '2.1', unit: 'm/s', icon: Wind, color: 'text-slate-400' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-emerald-900/20 bg-gray-50/50 dark:bg-emerald-900/10">
                  <div className="text-[10px] opacity-60 font-black mb-1 flex items-center gap-1.5 uppercase">
                    <item.icon size={12} className={item.color} /> {item.label}
                  </div>
                  <div className="text-lg font-black dark:text-emerald-300">
                    {item.val}<span className="text-[10px] ml-1 opacity-50 font-normal">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </EcoPanel>
          
          <EcoPanel title="碳汇活度趋势" icon={Activity} flex="1">
            <div className="absolute inset-0 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ecoData}>
                  <defs>
                    <linearGradient id="forestColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === 'dark' ? '#064e3b' : '#f0fdf4'} />
                  <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#forestColor)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </EcoPanel>
        </aside>

        {/* 核心地图区域 */}
        <div className="flex-1 min-w-0 h-full border-4 border-white dark:border-emerald-950/50 rounded-3xl overflow-hidden bg-[#0a0f0d] relative shadow-2xl">
          <MapContainer 
            center={[30.485, 119.595]} 
            zoom={14} 
            className="z-10"
            zoomControl={false}
          >
            <MapResizeFix />
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            
            <GeoJSON 
              data={FOREST_CORE_DATA} 
              style={plotStyle}
              onEachFeature={(feature: Feature<Geometry, ForestProperties>, layer: L.Layer) => {
                layer.bindPopup(`
                  <div style="padding: 4px; font-family: sans-serif;">
                    <p style="margin: 0; font-weight: 900; color: #064e3b">${feature.properties.name}</p>
                    <p style="margin: 4px 0; font-size: 12px">状态：${feature.properties.type}</p>
                  </div>
                `);
              }}
            />

            <Marker position={[30.482, 119.598]} icon={sensorIcon}>
              <Popup>红外热成像传感器 S-01</Popup>
            </Marker>
          </MapContainer>

          {/* 地图内浮动图例 */}
          <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
             <div className="bg-emerald-950/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 text-white shadow-2xl">
                <div className="text-[11px] font-black tracking-widest mb-3 text-emerald-400">林权郁闭度</div>
                <div className="space-y-2">
                  {['高密度林', '中密度林', '经济林区'].map((label, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-sm ${['bg-emerald-800', 'bg-emerald-600', 'bg-emerald-400'][i]}`} />
                      <span className="text-[10px] font-bold opacity-80">{label}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <aside className="w-[280px] flex flex-col gap-4 shrink-0 h-full">
          <EcoPanel title="林火监测与巡航" icon={Activity} className="h-44">
            <div className="p-4 space-y-3">
               <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <div className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase">易燃物载荷</div>
                  <div className="text-sm font-black text-rose-600">低</div>
               </div>
               <Button className="w-full py-3 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black shadow-lg transition-transform active:scale-95">
                 一键调度无人机
               </Button>
            </div>
          </EcoPanel>

          <EcoPanel title="植被生物量" icon={Layers} flex="1">
            <div className="p-4 space-y-5">
              {[
                { n: '活立木蓄积', v: '98.2', u: 'm³/ha', p: 85 },
                { n: '林分平均高度', v: '12.4', u: 'm', p: 65 },
                { n: '碳密度', v: '44.5', u: 't/ha', p: 40 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-2 font-bold">
                    <span className="opacity-70">{item.n}</span>
                    <span className="text-emerald-600">{item.v}{item.u}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-emerald-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </EcoPanel>
        </aside>
      </main>

      <footer className="h-8 shrink-0 flex items-center px-6 justify-between text-[10px] font-mono font-bold bg-white dark:bg-[#0a0f0d] border rounded-xl dark:border-emerald-900/60 shadow-inner">
        <div className="flex gap-6 text-emerald-800 dark:text-emerald-500">
           <span className="animate-pulse">● 数据流已加密</span>
           <span>偏航校正：0.00012°</span>
        </div>
        <div className="opacity-40 tracking-[0.2em]">ANJI FOREST DIGITAL HUB v2.1.0</div>
      </footer>

      <style>{`
        .leaflet-container { width: 100%; height: 100%; z-index: 1; background: #010503 !important; }
        .dark .leaflet-tile { filter: brightness(0.6) contrast(1.2) saturate(0.8) !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}