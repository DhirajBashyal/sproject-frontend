import { LayoutDashboard, MessagesSquare, Share2 } from "lucide-react";
import { NavLink } from "react-router";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: MessagesSquare },
  { to: "/channels", label: "Social Media", icon: Share2 },
];

export function Sidebar() {
  const open = useUiStore((state) => state.sidebarOpen);
  const setOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r bg-background p-4 transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center gap-2 px-2 font-bold">
          <img src="/logo.png" alt="" className="size-7 object-contain" />
          {env.appName}
        </div>
        <nav className="grid gap-1" aria-label="Main">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
