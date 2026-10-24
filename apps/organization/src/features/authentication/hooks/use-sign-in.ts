"use client";

import { useMutation } from "@tanstack/react-query";
import {
  signInWithPassword,
  signOut,
  verifySignInCode,
} from "@healthalyst/platform-api/authentication-service";

export function usePasswordSignInMutation() {
  return useMutation({ mutationFn: signInWithPassword });
}

export function useSignInCodeMutation() {
  return useMutation({ mutationFn: verifySignInCode });
}

export function useSignOutMutation() {
  return useMutation({ mutationFn: signOut });
}
