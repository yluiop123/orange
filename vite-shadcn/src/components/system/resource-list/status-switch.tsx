import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { isStatusEnabled, STATUS_DISABLED, STATUS_ENABLED, type Status } from "@/lib/status";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

type StatusSwitchProps = {
  initial: string;
  onChange: (value: Status) => void | Promise<unknown>;
  disabled?: boolean;
  /** 关闭开关前的确认文案；不传使用默认文案。 */
  disableDescription?: string;
};

/**
 * 状态开关：本地先乐观更新；请求失败时回滚，等待期间禁用。
 * 关闭（停用）前先弹确认框，避免误操作让账号或权限立即失效。
 */
export function StatusSwitch({ initial, onChange, disabled, disableDescription }: StatusSwitchProps) {
  const intl = useIntl();
  const [checked, setChecked] = useState(isStatusEnabled(initial));
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setChecked(isStatusEnabled(initial));
  }, [initial]);

  async function commit(value: boolean) {
    setChecked(value);
    setPending(true);
    try {
      await onChange(value ? STATUS_ENABLED : STATUS_DISABLED);
    } catch {
      setChecked(!value);
    } finally {
      setPending(false);
    }
  }

  function handleChange(value: boolean) {
    if (!value) {
      setConfirmOpen(true);
      return;
    }
    void commit(true);
  }

  async function confirmDisable() {
    setConfirmOpen(false);
    await commit(false);
  }

  return (
    <>
      <Switch
        checked={checked}
        disabled={disabled || pending}
        onCheckedChange={handleChange}
        aria-label={intl.formatMessage({ id: "table.toggleStatus" })}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intl.formatMessage({ id: "table.disableTitle" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableDescription
                ?? intl.formatMessage({ id: "table.disableConfirm" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {intl.formatMessage({ id: "button.cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmDisable()}
            >
              {intl.formatMessage({ id: "button.disable" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
