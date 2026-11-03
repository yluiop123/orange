import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function AlertDialogDemo() {
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Alert Dialog / 警告对话框</h1>
        <p className="text-muted-foreground mt-2">用于展示需要确认的危险操作 / Confirm destructive actions.</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-xl font-semibold">Basic / 基础用法</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive">Delete Item</Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction variant="destructive">
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div>
            <AlertDialog>
              <AlertDialogTrigger>
                <Button>Sign Out</Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>You'll need to sign in again to continue.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline">
                    Stay
                  </AlertDialogCancel>
                  <AlertDialogAction variant="destructive">
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Accessibility / 可访问性</h3>
          <p className="text-sm text-muted-foreground">AlertDialogs trap focus and require explicit confirmation; keyboard users can press Enter to confirm or Esc to cancel.</p>
        </div>
      </section>
    </div>
  );
}
