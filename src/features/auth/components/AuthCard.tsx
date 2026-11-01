import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { env } from "@/config/env";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-muted p-4">
      <Card className="grid w-full max-w-sm gap-5">
        <title>{`${title} · ${env.appName}`}</title>
        <div className="flex items-center gap-2 font-bold">
          <img src="/logo.svg" alt="" className="size-7" />
          {env.appName}
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        {children}
      </Card>
    </main>
  );
}
