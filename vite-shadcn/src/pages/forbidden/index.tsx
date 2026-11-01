import { useAccessToken } from "@/auth/token";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIntl } from "react-intl";
import { Navigate, useLocation, useNavigate } from "react-router";

export default function Forbidden() {
  const token = useAccessToken();
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const from =
    (location.state as { from?: string } | null)?.from ?? location.pathname;

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-6xl font-bold tracking-tight text-destructive">403</p>
          <CardTitle>{intl.formatMessage({ id: "page.forbidden.title" })}</CardTitle>
          <CardDescription>
            {intl.formatMessage({ id: "page.forbidden.desc" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
            {from}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {intl.formatMessage({ id: "page.forbidden.back" })}
            </Button>
            <Button onClick={() => navigate("/", { replace: true })}>
              {intl.formatMessage({ id: "page.forbidden.home" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
