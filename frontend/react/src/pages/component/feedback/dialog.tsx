import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Dialog / 对话框</h1>
        <p className="text-muted-foreground mt-2">常规模态对话框 / General modal dialogs.</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-xl font-semibold">Basic & Sizes / 基础与尺寸</h2>
        <div className="flex flex-col gap-4">
          <div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger>
                <Button>Open Dialog (center)</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Centered Dialog</DialogTitle>
                  <DialogDescription>Default centered modal.</DialogDescription>
                </DialogHeader>
                <div className="p-4">Short content.</div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                  <Button onClick={() => alert('Confirmed')}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Dialog>
              <DialogTrigger>
                <Button>Open Large Dialog</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Large Dialog</DialogTitle>
                  <DialogDescription>Use for more complex forms or content.</DialogDescription>
                </DialogHeader>
                <div className="p-4 h-60 overflow-auto">
                  <p>Long scrollable content:</p>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <p key={i} className="text-sm text-muted-foreground">Line {i + 1}</p>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline">Close</Button>
                  <Button onClick={() => alert('Saved')}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </div>
  );
}
