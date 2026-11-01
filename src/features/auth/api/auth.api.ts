import { http } from "@/lib/axios";
import type { TokenPair } from "@/types/api.types";
import type { LoginInput, RegisterInput } from "../schemas";
import type { User } from "../types";

export const authApi = {
  login: (input: LoginInput) =>
    http.post<TokenPair>("/api/auth/user/login", input, { skipAuth: true }).then((r) => r.data),
  register: (input: RegisterInput) =>
    http.post<User>("/api/auth/user/register", input, { skipAuth: true }).then((r) => r.data),
  logout: (refreshToken: string) =>
    http.post<void>("/api/auth/user/logout", { refresh_token: refreshToken }),
  me: () => http.get<User>("/api/auth/user/me").then((r) => r.data),
};
