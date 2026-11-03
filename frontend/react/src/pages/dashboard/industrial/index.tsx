import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ContactShadows,
    Float,
    Grid,
    MeshWobbleMaterial,
    OrbitControls,
    Stars,
    Text
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Activity, AlertTriangle, Box, Cpu, Database, ShieldCheck, Zap } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import * as THREE from 'three';

// --- 3D 场景组件 (动态适配颜色) ---
function SceneBackground({ isDark }: { isDark: boolean }) {
  return (
    <>
      <color attach="background" args={[isDark ? '#020617' : '#f8fafc']} />
      {isDark && <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}
      <Grid
        infiniteGrid
        cellSize={1}
        sectionSize={5}
        fadeDistance={30}
        fadeStrength={5}
        sectionColor={isDark ? "#1e293b" : "#cbd5e1"}
        cellColor={isDark ? "#0f172a" : "#e2e8f0"}
      />
      <ContactShadows opacity={isDark ? 0.4 : 0.2} scale={10} blur={2.4} far={4.5} color={isDark ? "#000000" : "#94a3b8"} />
    </>
  );
}

function TechModel({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Group>(null!);
  useFrame((state) => {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
  });

  return (
    <group ref={meshRef}>
      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <mesh>
          <octahedronGeometry args={[1.2, 0]} />
          <MeshWobbleMaterial color={isDark ? "#0ea5e9" : "#3b82f6"} factor={0.4} speed={1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.05, 16, 100]} />
          <meshBasicMaterial color={isDark ? "#38bdf8" : "#2563eb"} transparent opacity={0.3} />
        </mesh>
      </Float>
      <Text position={[0, -2.8, 0]} fontSize={0.2} color={isDark ? "#64748b" : "#94a3b8"}>
        系统核心单元: 运行正常
      </Text>
    </group>
  );
}

// --- 主组件 ---
const IndustrialDashboard = () => {
  const [isDark, setIsDark] = useState(true);

  // 检测系统/应用主题状态
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    load: Math.floor(Math.random() * 30) + 50,
    temp: Math.floor(Math.random() * 15) + 35,
  })), []);

  const modules = [
    { name: '核心处理器', status: '运行中', val: '2.4GHz', icon: Cpu },
    { name: '传感器阵列', status: '已连接', val: '正常', icon: Database },
    { name: '神经链路', status: '同步中', val: '1.2ms', icon: Zap },
    { name: '冷却循环', status: '高负载', val: '警告', icon: AlertTriangle, color: 'text-amber-500' },
    { name: '能量储备', status: '在线', val: '98%', icon: ShieldCheck },
    { name: '外部接口', status: '加密', val: 'SSL', icon: Box },
  ];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-background text-foreground p-4 overflow-hidden font-sans transition-colors duration-500">
      
      {/* 顶部标题栏 */}
      <div className="flex shrink-0 justify-between items-center mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded border border-primary/20">
            <Activity className="text-primary w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">量子工业指挥系统</h1>
            <p className="text-[10px] text-muted-foreground uppercase">节点: CN-EAST-01 | 实时数据流</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">完整性</p>
            <p className="text-sm font-mono text-emerald-500 font-bold">99.9%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">延迟</p>
            <p className="text-sm font-mono text-primary font-bold">14MS</p>
          </div>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* 左侧：3D 视觉区 */}
        <div className="col-span-12 lg:col-span-8 relative bg-accent/5 rounded-xl border border-border overflow-hidden">
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 35 }}>
            <Suspense fallback={null}>
              <SceneBackground isDark={isDark} />
              <TechModel isDark={isDark} />
              <ambientLight intensity={isDark ? 0.4 : 0.8} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <EffectComposer>
                <Bloom luminanceThreshold={isDark ? 1 : 1.5} mipmapBlur intensity={isDark ? 0.8 : 0.4} />
                <Vignette darkness={isDark ? 1.1 : 0.5} />
              </EffectComposer>
            </Suspense>
            <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} />
          </Canvas>
          <div className="absolute bottom-4 left-4 p-3 bg-background/80 backdrop-blur-md border border-border rounded-lg shadow-sm">
            <p className="text-[10px] text-primary font-bold mb-1 uppercase tracking-widest">扫描状态</p>
            <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}} />
            </div>
          </div>
        </div>

        {/* 右侧：监控面板区 */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
          
          {/* 1. 负载图表 (固定高度) */}
          <Card className="shrink-0 bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground flex justify-between items-center uppercase">
                负载矩阵分析 <Cpu size={14} className="text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[120px] w-full relative">
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart data={chartData}>
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontSize: '10px' 
                      }}
                    />
                    <Line type="stepAfter" dataKey="load" stroke={isDark ? "#3b82f6" : "#2563eb"} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 2. 模块列表 (自动填充剩余空间且可滚动) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 pb-1">系统模块状态</p>
            {modules.map((m, i) => (
              <div key={i} className="bg-accent/10 border border-border p-3 rounded-lg flex items-center justify-between hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <m.icon size={16} className={m.color || "text-primary"} />
                  <div>
                    <div className="text-[11px] font-bold">{m.name}</div>
                    <div className="text-[9px] text-muted-foreground">{m.status}</div>
                  </div>
                </div>
                <div className={`font-mono text-xs font-bold ${m.color || "text-primary"}`}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* 3. 底部操作按钮 */}
          <Button className="shrink-0 w-full py-4 h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-[11px] tracking-[0.2em] uppercase transition-all shadow-md active:scale-[0.98]">
            紧急指令覆盖系统
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary)); }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};

export default IndustrialDashboard;