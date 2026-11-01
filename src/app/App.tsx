import { env } from "@/config/env";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router";

export function App() {
  return (
    <AppProviders>
      <title>{env.appName}</title>
      <AppRouter />
    </AppProviders>
  );
}
