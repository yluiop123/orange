import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export default function WatermarkDemo() {
  const [text, setText] = useState('Demo Watermark / 水印示例');
  const [rotation, setRotation] = useState( -30 );
  const [fontSize, setFontSize] = useState(64);
  const [opacity, setOpacity] = useState(0.08);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Watermark / 水印</h1>
        <p className="text-muted-foreground mt-2">页面或区域的水印示例。</p>
      </div>

      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold">Basic / 基础用法</h2>
        <div className="mt-4 p-8 border relative overflow-hidden" style={{ minHeight: 220 }}>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              opacity,
              fontSize,
              color: 'var(--muted-foreground)',
              transformOrigin: 'center',
            }}
          >
            {text}
          </div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground">Your content goes here. The watermark appears behind content.</p>
          </div>
        </div>
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
          <Input value={text} onChange={e => setText(e.target.value)} className="col-span-2" />
          <Button onClick={() => setText('Demo Watermark / 水印示例')}>Reset</Button>
          <div className="flex items-center gap-2">
            <label className="text-sm">Rotation</label>
            <Slider
              min={-90}
              max={90}
              value={[rotation]}
              onValueChange={(value) => setRotation(Array.isArray(value) ? value[0] : value)}
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Font Size</label>
            <Slider
              min={24}
              max={200}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(Array.isArray(value) ? value[0] : value)}
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Opacity</label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[opacity]}
              onValueChange={(value) => setOpacity(Array.isArray(value) ? value[0] : value)}
              className="w-32"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
