import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "react-router";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toApiError } from "@/lib/axios";

export function CallbackCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center p-6">
      <Card className="grid w-full max-w-md gap-4">{children}</Card>
    </div>
  );
}

export function CallbackFailure({ message }: { message: string }) {
  return (
    <CallbackCard>
      <h1 className="text-lg font-bold">Couldn't connect</h1>
      <Alert>{message}</Alert>
      <Button asChild>
        <Link to="/channels">Start again</Link>
      </Button>
    </CallbackCard>
  );
}

export function CallbackShell({ loading, children }: { loading: string; children: ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <CallbackFailure message={toApiError(error).detail} />}>
      <Suspense
        fallback={
          <CallbackCard>
            <p className="text-sm text-muted-foreground">{loading}</p>
          </CallbackCard>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
