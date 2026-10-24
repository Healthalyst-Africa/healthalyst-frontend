import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export type StaffSessionStatus =
  "loading" | "authenticated" | "unauthenticated" | "error";

export type StaffSessionContextValue = {
  staffIdentity: StaffIdentity | null;
  status: StaffSessionStatus;
  sessionError: string | null;
  setStaffIdentity: (staffIdentity: StaffIdentity) => void;
  clearSession: () => void;
  restoreSession: () => Promise<void>;
};
