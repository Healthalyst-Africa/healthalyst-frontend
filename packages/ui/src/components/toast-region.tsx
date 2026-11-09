"use client";

import { toast } from "sonner";
import { Toaster } from "@healthalyst/ui/primitives/sonner";

/**
 * Where short confirmations appear. Render it once per app. Use toasts only
 * for brief news such as "Calendar saved"; page, step and panel states use
 * `StateNotice`, and inline guidance uses `NoticeBanner`.
 */
export function ToastRegion() {
  return <Toaster position="bottom-right" closeButton />;
}

/** Confirms a completed action, such as "Calendar saved". */
export function announceSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}
