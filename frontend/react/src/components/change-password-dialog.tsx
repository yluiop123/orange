import { changeOwnPassword } from "@/api/system/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forced?: boolean;
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
  forced = false,
}: ChangePasswordDialogProps) {
  const intl = useIntl();
  const navigate = useNavigate();
  const clearSession = useUserStore((state) => state.clearSession);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setError(intl.formatMessage({ id: "password.change.min" }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(intl.formatMessage({ id: "password.change.mismatch" }));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await changeOwnPassword(oldPassword, newPassword);
      toast.success(intl.formatMessage({ id: "password.change.success" }));
      reset();
      onOpenChange(false);
      clearSession();
      navigate("/login", { replace: true });
    } catch {
      // 错误提示由 axios 拦截器统一处理
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!forced) onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={!forced}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage({
                id: forced
                  ? "password.change.force.title"
                  : "password.change.title",
              })}
            </DialogTitle>
            <DialogDescription>
              {intl.formatMessage({
                id: forced
                  ? "password.change.force.desc"
                  : "password.change.desc",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="old-password">
                {intl.formatMessage({ id: "password.change.old" })}
              </Label>
              <Input
                id="old-password"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">
                {intl.formatMessage({ id: "password.change.new" })}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">
                {intl.formatMessage({ id: "password.change.confirm" })}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            {!forced && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {intl.formatMessage({ id: "button.cancel" })}
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {intl.formatMessage({ id: "password.change.submit" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
