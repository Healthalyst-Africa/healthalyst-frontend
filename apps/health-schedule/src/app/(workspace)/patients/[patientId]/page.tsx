import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PatientRecordPage } from "~/features/patients/components/patient-record-page";

export const metadata: Metadata = { title: "Patient record | HealthSchedule" };

const patientIdentifierSchema = z.string().uuid();

export default async function PatientRecordRoute({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const patientIdentifier = patientIdentifierSchema.safeParse(patientId);
  if (!patientIdentifier.success) notFound();
  return <PatientRecordPage patientId={patientIdentifier.data} />;
}
