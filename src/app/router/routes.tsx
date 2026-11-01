import { Navigate, type RouteObject } from "react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export const routes: RouteObject[] = [
  {
    path: "/login",
    lazy: async () => ({ Component: (await import("@/features/auth/pages/LoginPage")).LoginPage }),
  },
  {
    path: "/register",
    lazy: async () => ({
      Component: (await import("@/features/auth/pages/RegisterPage")).RegisterPage,
    }),
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: DashboardLayout,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/features/dashboard/pages/DashboardPage")).DashboardPage,
            }),
          },
          {
            path: "/inbox",
            lazy: async () => ({
              Component: (await import("@/features/inbox/pages/InboxPage")).InboxPage,
            }),
          },
          {
            path: "/channels",
            lazy: async () => ({
              Component: (await import("@/features/channels/pages/IntegrationsPage")).IntegrationsPage,
            }),
          },
          {
            path: "/channels/widget",
            lazy: async () => ({
              Component: (await import("@/features/widget/pages/WidgetPage")).WidgetPage,
            }),
          },
          {
            path: "/channels/:platform",
            lazy: async () => ({
              Component: (await import("@/features/channels/pages/PlatformChannelsPage"))
                .PlatformChannelsPage,
            }),
          },
          // These two paths are the OAuth redirect URIs. Do not rename them.
          {
            path: "/social-media-integration/facebook",
            lazy: async () => ({
              Component: (await import("@/features/channels/pages/FacebookCallbackPage"))
                .FacebookCallbackPage,
            }),
          },
          {
            path: "/social-media-integration/instagram",
            lazy: async () => ({
              Component: (await import("@/features/channels/pages/InstagramCallbackPage"))
                .InstagramCallbackPage,
            }),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
