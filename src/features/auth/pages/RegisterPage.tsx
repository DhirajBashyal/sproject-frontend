import { useActionState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { toApiError } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "../api/auth.api";
import { AuthCard } from "../components/AuthCard";
import { registerSchema } from "../schemas";

interface RegisterState {
  error?: string;
  fields?: Record<string, string | undefined>;
  name?: string;
  email?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [state, formAction] = useActionState(
    async (_previous: RegisterState, form: FormData): Promise<RegisterState> => {
      const name = String(form.get("name"));
      const email = String(form.get("email"));
      const parsed = registerSchema.safeParse({ name, email, password: form.get("password") });
      if (!parsed.success) {
        const { fieldErrors } = z.flattenError(parsed.error);
        return {
          name,
          email,
          fields: {
            name: fieldErrors.name?.[0],
            email: fieldErrors.email?.[0],
            password: fieldErrors.password?.[0],
          },
        };
      }
      try {
        await authApi.register(parsed.data);
        // Register doesn't log the user in, so that takes a second request.
        useAuthStore.getState().setTokens(
          await authApi.login({ email: parsed.data.email, password: parsed.data.password }),
        );
        await navigate("/channels", { replace: true });
        return {};
      } catch (error) {
        const apiError = toApiError(error);
        return { name, email, error: apiError.detail, fields: apiError.fieldErrors };
      }
    },
    {},
  );

  return (
    <AuthCard title="Create your account">
      <form action={formAction} className="grid gap-4" noValidate>
        <FormField id="name" label="Name" autoComplete="name" defaultValue={state.name} error={state.fields?.name} />
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
          autoComplete="new-password"
          hint="8 to 72 characters"
          error={state.fields?.password}
        />
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
