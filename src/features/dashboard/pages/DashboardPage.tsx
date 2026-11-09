import { MessagesSquare, Share2, SquarePen } from "lucide-react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { useMe } from "@/features/auth/hooks/useAuth";

const shortcuts = [
  { to: "/inbox", title: "Inbox", text: "Read and reply to conversations.", icon: MessagesSquare },
  { to: "/posts/new", title: "Create post", text: "Write a post with AI and publish it.", icon: SquarePen },
  { to: "/channels", title: "Social Media", text: "Connect and manage your channels.", icon: Share2 },
];

export function DashboardPage() {
  const { data: user } = useMe();

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6">
      <title>Dashboard</title>
      <h1 className="text-2xl font-bold">{user ? `Welcome, ${user.name}` : "Welcome"}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {shortcuts.map(({ to, title, text, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="grid gap-2 hover:bg-muted">
              <Icon className="size-5 text-primary" />
              <b>{title}</b>
              <p className="text-sm text-muted-foreground">{text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
