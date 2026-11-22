"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  useHoldSlot,
  useReleaseHold,
} from "~/features/appointments/hooks/use-appointments";
import type { Appointment } from "~/features/appointments/schemas/appointment-response-schemas";
import type { HoldRequest } from "~/features/appointments/utilities/appointment-requests";
import { secondsUntil } from "~/features/appointments/utilities/slot-choices";

const COUNTDOWN_INTERVAL_MILLISECONDS = 1000;

/**
 * Keeps the chosen time for five minutes while the desk confirms the
 * booking. Choosing another time, or closing without booking, gives the
 * previous one back so other desks can book it.
 */
export function useSlotHold() {
  const holdMutation = useHoldSlot();
  const releaseMutation = useReleaseHold();
  const [hold, setHold] = useState<Appointment | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const heldIdentifierReference = useRef<string | null>(null);

  const releaseCurrent = useCallback(() => {
    const heldIdentifier = heldIdentifierReference.current;
    heldIdentifierReference.current = null;
    setHold(null);
    if (heldIdentifier) releaseMutation.mutate(heldIdentifier);
    // The release mutation is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const holdTime = useCallback(
    (request: Omit<HoldRequest, "id">) => {
      releaseCurrent();
      holdMutation.mutate(
        { ...request, id: crypto.randomUUID() },
        {
          onSuccess: (heldAppointment) => {
            heldIdentifierReference.current = heldAppointment.id;
            if (heldAppointment.holdExpiresAt) {
              setSecondsLeft(
                secondsUntil(heldAppointment.holdExpiresAt, new Date())
              );
            }
            setHold(heldAppointment);
          },
        }
      );
    },
    // The hold mutation is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [releaseCurrent]
  );

  /** After booking, the hold has become the appointment: nothing to give back. */
  const forgetHold = useCallback(() => {
    heldIdentifierReference.current = null;
    setHold(null);
    holdMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expiresAt = hold?.holdExpiresAt ?? null;
  useEffect(() => {
    if (!expiresAt) return;
    const updateCountdown = () =>
      setSecondsLeft(secondsUntil(expiresAt, new Date()));
    updateCountdown();
    const intervalIdentifier = window.setInterval(
      updateCountdown,
      COUNTDOWN_INTERVAL_MILLISECONDS
    );
    return () => window.clearInterval(intervalIdentifier);
  }, [expiresAt]);

  // Give the time back if the screen closes while it is held.
  useEffect(() => releaseCurrent, [releaseCurrent]);

  return {
    hold,
    hasExpired: hold !== null && expiresAt !== null && secondsLeft === 0,
    secondsLeft,
    isHolding: holdMutation.isPending,
    holdError: holdMutation.error,
    holdErrorCode:
      holdMutation.error instanceof PlatformApiError
        ? holdMutation.error.code
        : null,
    holdTime,
    releaseCurrent,
    forgetHold,
  };
}
