import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Skeleton / 骨架屏</h1>
        <p className="text-muted-foreground mt-2">占位加载状态指示。</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-xl font-semibold">Variants / 多种占位形式</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="rounded-full w-12 h-12 overflow-hidden">
              {loading ? <Skeleton className="h-12 w-12" /> : <img src="/favicon.ico" alt="avatar" />}
            </div>
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24 mt-2" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </>
              ) : (
                <div>
                  <h4 className="font-medium">Loaded Name</h4>
                  <p className="text-sm text-muted-foreground">Subtle info</p>
                </div>
              )}
            </div>
          </div>

          <div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold">Loaded Title</h3>
                <p className="text-sm text-muted-foreground">Content is loaded.</p>
              </div>
            )}
          </div>

          <div>
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-2">
                  {loading ? <Skeleton className="h-4 w-8" /> : <span className="w-8">{i + 1}</span>}
                  {loading ? <Skeleton className="h-4 w-full" /> : <span className="flex-1">Item {i + 1}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <Button variant="outline" onClick={() => setLoading(l => !l)}>
            Toggle Loading
          </Button>
        </div>
      </section>
    </div>
  );
}
