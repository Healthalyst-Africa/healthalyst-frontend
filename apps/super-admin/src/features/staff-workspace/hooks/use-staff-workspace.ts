"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { signOut } from "@healthalyst/platform-api/authentication-service";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";
import { APPLICATION_ROUTES } from "~/config/application-routes";

export function useStaffWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const { staffIdentity, status, sessionError, clearSession, restoreSession } =
    useStaffSession();
  const [signOutError, setSignOutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace(APPLICATION_ROUTES.signIn);
  }, [router, status]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
      clearSession();
      router.replace(APPLICATION_ROUTES.signIn);
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Sign out failed. Try again."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleOrganizationSearch(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const searchTerm = organizationSearch.trim();
    router.push(
      searchTerm
        ? `${APPLICATION_ROUTES.organizations}?search=${encodeURIComponent(searchTerm)}`
        : APPLICATION_ROUTES.organizations
    );
  }

  return {
    pathname,
    staffIdentity,
    status,
    sessionError,
    restoreSession,
    signOutError,
    isSigningOut,
    organizationSearch,
    setOrganizationSearch,
    handleSignOut,
    handleOrganizationSearch,
  };
}
