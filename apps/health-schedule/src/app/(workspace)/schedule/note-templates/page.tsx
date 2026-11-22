import type { Metadata } from "next";
import { NoteTemplatesPage } from "~/features/clinical-record/components/note-templates-page";

export const metadata: Metadata = { title: "Note templates | HealthSchedule" };

export default function NoteTemplatesRoute() {
  return <NoteTemplatesPage />;
}
