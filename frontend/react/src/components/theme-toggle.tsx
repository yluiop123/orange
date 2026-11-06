import { Moon, Sun } from "lucide-react";
import { useIntl } from "react-intl";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store";

export function ThemeToggle({ className }: { className?: string }) {
  const intl = useIntl();
  const { mode, setMode } = useThemeStore();
  const dark = mode === "dark";
  const label = intl.formatMessage({
    id: dark ? "header.theme.light" : "header.theme.dark",
    defaultMessage: dark ? "Light" : "Dark",
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      data-testid="theme-toggle"
      aria-label={label}
      onClick={() => setMode(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
