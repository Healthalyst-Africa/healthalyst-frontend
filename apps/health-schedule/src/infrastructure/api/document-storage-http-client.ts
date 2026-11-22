import axios, { type AxiosInstance } from "axios";

/** A large scan on a slow connection can take a while. */
const DOCUMENT_STORAGE_TIMEOUT_MILLISECONDS = 120_000;

let documentStorageHttpClient: AxiosInstance | undefined;

/**
 * Sends files straight to document storage through the short-lived upload
 * links the HealthSchedule API signs. It has no base address and never sends
 * the access token or cookies: the signed link is the only permission.
 */
export function getDocumentStorageHttpClient(): AxiosInstance {
  if (typeof window === "undefined")
    throw new Error("Document uploads run only in the browser.");
  documentStorageHttpClient ??= axios.create({
    timeout: DOCUMENT_STORAGE_TIMEOUT_MILLISECONDS,
    withCredentials: false,
  });
  return documentStorageHttpClient;
}
