import { useAccessToken } from "@/auth/token";
import { Button } from "@/components/ui/button";
import { useIntl } from "react-intl";
import { Navigate, useLocation, useNavigate } from "react-router";

export default function NotFound() {
  const token = useAccessToken();
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();

  // 未登录访问未知地址时，登录后回到原地址
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <h1 className="text-xl font-semibold">
        {intl.formatMessage({ id: "page.notfound.title" })}
      </h1>
      <p className="text-muted-foreground">
        {intl.formatMessage({ id: "page.notfound.desc" })}
      </p>
      <Button onClick={() => navigate("/", { replace: true })}>
        {intl.formatMessage({ id: "page.notfound.home" })}
      </Button>
    </div>
  );
}
