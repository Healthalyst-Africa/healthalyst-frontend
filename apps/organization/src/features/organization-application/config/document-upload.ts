export const DOCUMENT_UPLOAD_CONFIGURATION = {
  maximumFileNameLength: 200,
  maximumSizeBytes: 10 * 1024 * 1024,
  timeoutMilliseconds: 30_000,
  contentTypes: ["application/pdf", "image/jpeg", "image/png"],
} as const;
export const DOCUMENT_UPLOAD_ENDPOINTS = {
  uploadUrl: "/v1/onboarding/documents/upload-url",
  documents: "/v1/onboarding/documents",
} as const;
