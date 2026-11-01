import { create } from "zustand";

// The API has no organizations yet. This holds the selection once it does.
interface TenantState {
  organizationId: string | null;
  setOrganizationId: (organizationId: string | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  organizationId: null,
  setOrganizationId: (organizationId) => set({ organizationId }),
}));
