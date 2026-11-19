import { describe, expect, it } from "vitest";
import {
  callNextSamplePatient,
  checkInSamplePatient,
  finishSampleVisit,
  getSampleDayBoard,
  getSampleVisitBoard,
  listSampleQueueEntries,
  searchSamplePatients,
  sendSamplePatientOn,
  startSeeingSamplePatient,
} from "~/features/patient-flow/sample-data/sample-patient-flow";
import { listExpectedArrivals } from "~/features/patient-flow/utilities/front-desk";

describe("sample patient flow", () => {
  it("takes a booked patient from check-in to the end of the visit", async () => {
    const [arrival] = listExpectedArrivals(await getSampleDayBoard());
    expect(arrival).toBeDefined();
    if (!arrival) return;

    const visit = await checkInSamplePatient({
      id: "sample-test-visit",
      branchId: "sample-branch",
      appointmentId: arrival.id,
      queue: { kind: "TRIAGE" },
    });
    expect(visit.token).toMatch(/^A-\d{3}$/);
    await expect(
      checkInSamplePatient({
        id: "sample-test-visit-again",
        branchId: "sample-branch",
        appointmentId: arrival.id,
        queue: { kind: "TRIAGE" },
      })
    ).rejects.toMatchObject({ code: "APPOINTMENT_ALREADY_CHECKED_IN" });

    const called = await callNextSamplePatient({ kind: "TRIAGE" });
    expect(called.status).toBe("CALLED");
    await startSeeingSamplePatient(called.id);
    const laboratory = await sendSamplePatientOn(
      (await listSampleQueueEntries({ kind: "TRIAGE" })).find(
        (entry) => entry.visitId === visit.id
      )?.id ?? called.id,
      {
        to: {
          kind: "DEPARTMENT",
          departmentId: "sample-department-laboratory",
        },
      }
    );
    expect(laboratory.departmentName).toBe("Laboratory");

    await finishSampleVisit(visit.id);
    const board = await getSampleVisitBoard();
    expect(board.data.some((openVisit) => openVisit.visitId === visit.id)).toBe(
      false
    );
  });

  it("finds patients by name, phone or folder number", async () => {
    const byName = await searchSamplePatients("okafor");
    expect(byName.map((patient) => patient.firstName).sort()).toEqual([
      "Callistus",
      "Grace",
    ]);
    expect(await searchSamplePatients("0812 123 2280")).toHaveLength(1);
    expect(await searchSamplePatients("OPD/2019")).toHaveLength(1);
  });
});
