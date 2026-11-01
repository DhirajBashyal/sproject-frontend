import { useActionState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { toApiError } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "../api/auth.api";
import { AuthCard } from "../components/AuthCard";
import { loginSchema } from "../schemas";

interface LoginState {
  error?: string;
  fields?: Record<string, string | undefined>;
  email?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = useAuthStore((state) => state.tokens !== null);
  const from = (location.state as { from?: string } | null)?.from ?? "/inbox";

  const [state, formAction] = useActionState(
    async (_previous: LoginState, form: FormData): Promise<LoginState> => {
      const email = String(form.get("email"));
      const parsed = loginSchema.safeParse({ email, password: form.get("password") });
      if (!parsed.success) {
        const { fieldErrors } = z.flattenError(parsed.error);
        return {
          email,
          fields: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] },
        };
      }
      try {
        useAuthStore.getState().setTokens(await authApi.login(parsed.data));
        await navigate(from, { replace: true });
        return {};
      } catch (error) {
        const apiError = toApiError(error);
        return { email, error: apiError.detail, fields: apiError.fieldErrors };
      }
    },
    {},
  );

  if (signedIn) return <Navigate to={from} replace />;

  return (
    <AuthCard title="Sign in">
      <form action={formAction} className="grid gap-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          error={state.fields?.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={state.fields?.password}
        />
        {state.error && !state.fields?.email && !state.fields?.password && (
          <Alert>{state.error}</Alert>
        )}
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="text-primary underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
