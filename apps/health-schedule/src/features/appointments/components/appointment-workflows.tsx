"use client";

import { useState } from "react";
import {
  CancelAppointmentIcon,
  NoShowIcon,
  RescheduleAppointmentIcon,
} from "@healthalyst/icons";
import type { ActionMenuItem } from "@healthalyst/ui/components/action-menu";
import {
  AddToWaitlistDialog,
  type WaitlistCandidate,
} from "~/features/appointments/components/add-to-waitlist-dialog";
import { BookAppointmentDialog } from "~/features/appointments/components/book-appointment-dialog";
import { CancelAppointmentDialog } from "~/features/appointments/components/cancel-appointment-dialog";
import { NoShowDialog } from "~/features/appointments/components/no-show-dialog";
import type {
  Appointment,
  WaitlistEntry,
} from "~/features/appointments/schemas/appointment-response-schemas";
import type {
  BookingMode,
  BookingPatient,
} from "~/features/appointments/types/booking";
import { canRecordNoShow } from "~/features/appointments/utilities/appointment-presentation";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";

/**
 * Booking, moving, cancelling and "did not come", with the dialogs each
 * opens. Pages call the start functions and render `dialogs` once.
 */
export function useAppointmentWorkflows(branch: WorkspaceBranch | null) {
  const [bookingMode, setBookingMode] = useState<BookingMode | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [recordingNoShow, setRecordingNoShow] = useState<Appointment | null>(
    null
  );
  const [waitlistCandidate, setWaitlistCandidate] =
    useState<WaitlistCandidate | null>(null);

  function buildActions(
    appointment: Appointment,
    now: Date = new Date()
  ): ActionMenuItem[] {
    if (appointment.status !== "BOOKED") return [];
    return [
      {
        label: "Move to another time",
        icon: <RescheduleAppointmentIcon />,
        onSelect: () => setBookingMode({ kind: "reschedule", appointment }),
      },
      ...(canRecordNoShow(appointment, now)
        ? [
            {
              label: "Did not come",
              icon: <NoShowIcon />,
              onSelect: () => setRecordingNoShow(appointment),
            },
          ]
        : []),
      {
        label: "Cancel appointment",
        icon: <CancelAppointmentIcon />,
        tone: "destructive" as const,
        separatedAbove: true,
        onSelect: () => setCancelling(appointment),
      },
    ];
  }

  const dialogs = branch && (
    <>
      <BookAppointmentDialog
        mode={bookingMode}
        onOpenChange={(open) => {
          if (!open) setBookingMode(null);
        }}
        branch={branch}
        onAddToWaitlist={(patient, appointmentTypeId) => {
          setBookingMode(null);
          setWaitlistCandidate({ patient, appointmentTypeId });
        }}
      />
      <AddToWaitlistDialog
        candidate={waitlistCandidate}
        onOpenChange={(open) => {
          if (!open) setWaitlistCandidate(null);
        }}
        branch={branch}
      />
      <CancelAppointmentDialog
        appointment={cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
      />
      <NoShowDialog
        appointment={recordingNoShow}
        onOpenChange={(open) => {
          if (!open) setRecordingNoShow(null);
        }}
      />
    </>
  );

  return {
    startBooking: (patient: BookingPatient | null) =>
      setBookingMode({ kind: "book", patient }),
    startWaitlistBooking: (entry: WaitlistEntry) =>
      setBookingMode({ kind: "waitlist", entry }),
    buildActions,
    dialogs,
  };
}
