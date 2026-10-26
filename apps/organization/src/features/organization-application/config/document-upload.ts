export const DOCUMENT_UPLOAD_CONFIGURATION = {
  maximumFileNameLength: 200,
  maximumSizeBytes: 10 * 1024 * 1024,
  timeoutMilliseconds: 30_000,
  contentTypes: ["application/pdf", "image/jpeg", "image/png"],
  /** Media types and extensions offered by the drop target and file picker. */
  acceptedFileTypes: {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
  formatsDescription: "PDF, JPEG or PNG",
  /** How often to check documents that are still uploading or being scanned. */
  statusRefreshIntervalMilliseconds: 5_000,
} as const;
export const DOCUMENT_UPLOAD_ENDPOINTS = {
  uploadUrl: "/v1/onboarding/documents/upload-url",
  documents: "/v1/onboarding/documents",
} as const;
