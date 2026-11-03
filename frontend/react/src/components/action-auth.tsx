import { useAccess } from "@/store/access";
import { useLocation } from "react-router";

export default function ActionAuth({
  action,
  children,
}: {
  action: string;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const access = useAccess();
  if (!access.canAct(pathname, action)) return null;
  return <>{children}</>;
}
