import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth.store";

export function ProtectedRoute() {
  const signedIn = useAuthStore((state) => state.tokens !== null);
  const location = useLocation();

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
