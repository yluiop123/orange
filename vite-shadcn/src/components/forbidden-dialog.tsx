import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForbiddenStore } from "@/store/forbidden";
import { useIntl } from "react-intl";

export function ForbiddenDialog() {
  const intl = useIntl();
  const { open, path, message, hide } = useForbiddenStore();

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && hide()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {intl.formatMessage({ id: "page.forbidden.action.title" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {message ||
              intl.formatMessage({ id: "page.forbidden.action.desc" })}
            {path && (
              <span className="mt-2 block font-mono text-xs break-all">
                {path}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={hide}>
            {intl.formatMessage({ id: "page.forbidden.action.close" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
