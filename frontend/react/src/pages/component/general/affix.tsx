import Affix from "@/components/ext/affix"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"

export default function AffixPage() {
  const [offsetTop, setOffsetTop] = useState(16)
  const [offsetBottom, setOffsetBottom] = useState(16)
  const [offsetLeft, setOffsetLeft] = useState<number | undefined>(undefined)
  const [offsetRight, setOffsetRight] = useState<number | undefined>(0)

  return (
    <div className="min-h-[1200px] p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Affix / 固钉</h1>

        <section className="bg-card p-4 rounded">
          <h2 className="font-medium">Top Affix / 顶部固钉</h2>
          <p className="text-sm text-muted-foreground mt-1">示例：顶部固钉，支持顶部与水平偏移。</p>

          <div className="mt-4">
            <Affix offsetTop={offsetTop} offsetLeft={offsetLeft} offsetRight={offsetRight} className="bg-background p-3 rounded-md shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">Affixed header (dynamic offsets)</div>
                <div>
                  <Button size="sm" variant="outline">Action</Button>
                </div>
              </div>
            </Affix>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-sm">Offset Top</label>
              <Slider min={0} max={200} value={[offsetTop]} onValueChange={(value) => setOffsetTop(Array.isArray(value) ? value[0] : value)} className="w-32" />
              <span className="text-sm text-muted-foreground">{offsetTop}px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Left</label>
              <Input type="number" value={offsetLeft ?? ""} onChange={e => setOffsetLeft(e.target.value === "" ? undefined : Number(e.target.value))} className="w-20" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Right</label>
              <Input type="number" value={offsetRight ?? ""} onChange={e => setOffsetRight(e.target.value === "" ? undefined : Number(e.target.value))} className="w-20" />
            </div>
          </div>
        </section>

        <section className="bg-card p-4 rounded">
          <h2 className="font-medium">Bottom Fixed Affix / 底部固定</h2>
          <p className="text-sm text-muted-foreground mt-1">示例：底部固定（滚动到指定位置后固定），可设置底部与水平偏移。</p>

          <div className="mt-4 border rounded p-4" style={{ minHeight: 420 }}>
            <div className="space-y-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="p-2 bg-card rounded border">
                  <p className="text-sm">Scroll content {i + 1}</p>
                </div>
              ))}
            </div>

            <Affix position="bottom" offsetBottom={offsetBottom} offsetLeft={offsetLeft} offsetRight={offsetRight}>
              <div className="bg-background p-3 rounded-md shadow-lg flex items-center gap-2">
                <Button>Primary / 主要</Button>
                <Button variant="ghost">Secondary / 次要</Button>
              </div>
            </Affix>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm">Offset Bottom</label>
              <Slider min={0} max={120} value={[offsetBottom]} onValueChange={(value) => setOffsetBottom(Array.isArray(value) ? value[0] : value)} className="w-32" />
              <span className="text-sm text-muted-foreground">{offsetBottom}px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Left (px)</label>
              <Input type="number" value={offsetLeft ?? ""} onChange={e => setOffsetLeft(e.target.value === "" ? undefined : Number(e.target.value))} className="w-24" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Right (px)</label>
              <Input type="number" value={offsetRight ?? ""} onChange={e => setOffsetRight(e.target.value === "" ? undefined : Number(e.target.value))} className="w-24" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
