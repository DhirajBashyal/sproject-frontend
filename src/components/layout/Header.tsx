import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/features/auth/hooks/useAuth";
import { useUiStore } from "@/stores/ui.store";

export function Header() {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { data: user } = useMe();
  const logout = useLogout();
  const { isDark, setTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu />
      </Button>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-muted-foreground">{user?.name}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
