import { Languages } from "lucide-react";
import { useIntl } from "react-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, useLocaleStore, type Locale } from "@/store";

export function LocaleSwitcher() {
  const intl = useIntl();
  const { locale, setLocale } = useLocaleStore();
  const current =
    SUPPORTED_LOCALES.find((item) => item.id === locale) ?? SUPPORTED_LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 font-normal"
            data-testid="locale-switcher"
            aria-label={intl.formatMessage({
              id: "header.language",
              defaultMessage: "Language",
            })}
          />
        }
      >
        <Languages className="size-4" />
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => setLocale(value as Locale)}
        >
          {SUPPORTED_LOCALES.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id} closeOnClick>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
