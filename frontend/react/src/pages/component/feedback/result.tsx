import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function ResultDemo() {
  const [ok, setOk] = useState(true);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Result / 结果页</h1>
        <p className="text-muted-foreground mt-2">展示操作结果的简洁页面。</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-4">
        <div className="flex items-start gap-6">
          <div>
            {ok ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{ok ? 'Success / 成功' : 'Failed / 失败'}</h3>
            <p className="text-sm text-muted-foreground">{ok ? 'Your operation completed successfully.' : 'There was an error processing your request.'}</p>
            {!ok && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">View details</summary>
                <pre className="mt-2 rounded bg-muted p-2 text-xs">Error: Something went wrong while saving.</pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={() => alert('Back to dashboard')}>Back to Home</Button>
              <Button variant="outline" onClick={() => setOk(v => !v)}>{ok ? 'Simulate Error' : 'Simulate Success'}</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
