import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

type StatusSwitchProps = {
  initial: string;
  onChange: (value: "0" | "1") => void | Promise<unknown>;
  disabled?: boolean;
};

/**
 * 状态开关：本地先乐观更新；请求失败时回滚，等待期间禁用。
 */
export function StatusSwitch({ initial, onChange, disabled }: StatusSwitchProps) {
  const intl = useIntl();
  const [checked, setChecked] = useState(initial === "1");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setChecked(initial === "1");
  }, [initial]);

  async function handleChange(value: boolean) {
    setChecked(value);
    setPending(true);
    try {
      await onChange(value ? "1" : "0");
    } catch {
      setChecked(!value);
    } finally {
      setPending(false);
    }
  }

  return (
    <Switch
      checked={checked}
      disabled={disabled || pending}
      onCheckedChange={handleChange}
      aria-label={intl.formatMessage({ id: "table.toggleStatus" })}
    />
  );
}
