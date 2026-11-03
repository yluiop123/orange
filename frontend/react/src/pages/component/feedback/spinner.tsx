import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

export default function SpinnerDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Spinner / 加载指示器</h1>
        <p className="text-muted-foreground mt-2">简单的旋转加载指示器。</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-xl font-semibold">Sizes & Inline / 大小与内联</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Loader2Icon className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
            <div className="text-sm">Small</div>
          </div>
          <div className="text-center">
            <Loader2Icon className={`h-10 w-10 ${loading ? 'animate-spin' : ''}`} />
            <div className="text-sm">Default</div>
          </div>
          <div className="text-center">
            <Loader2Icon className={`h-16 w-16 ${loading ? 'animate-spin' : ''}`} />
            <div className="text-sm">Large</div>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Inline in Button</h3>
          <div className="mt-2">
            <Button className="flex items-center gap-2" onClick={() => setLoading(l => !l)}>
              {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {loading ? 'Loading...' : 'Click to Load'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
