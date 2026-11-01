import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIntl } from "react-intl";
import { toast } from "sonner";

type PasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  username?: string;
};

/** 展示新增用户/重置密码生成的一次性临时密码 */
export function PasswordDialog({
  open,
  onOpenChange,
  password,
  username,
}: PasswordDialogProps) {
  const intl = useIntl();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(intl.formatMessage({ id: "password.dialog.copied" }));
    } catch {
      toast.error(intl.formatMessage({ id: "password.dialog.copy.failed" }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{intl.formatMessage({ id: "password.dialog.title" })}</DialogTitle>
          <DialogDescription>
            {intl.formatMessage(
              { id: "password.dialog.desc" },
              { username: username ?? "" },
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-lg tracking-wider">
            {password}
          </code>
          <Button type="button" variant="outline" onClick={handleCopy}>
            {intl.formatMessage({ id: "password.dialog.copy" })}
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {intl.formatMessage({ id: "button.close" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
