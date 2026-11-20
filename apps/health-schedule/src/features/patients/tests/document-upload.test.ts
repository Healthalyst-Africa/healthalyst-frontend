import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";

const clients = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("~/infrastructure/api/health-schedule-http-client", () => ({
  getHealthScheduleHttpClient: () => ({ post: clients.post }),
}));

vi.mock("~/infrastructure/api/document-storage-http-client", () => ({
  getDocumentStorageHttpClient: () => ({ put: clients.put }),
}));

const { uploadDocument } =
  await import("~/features/patients/services/document-service");

const DOCUMENT = {
  id: "document-1",
  patientId: "patient-1",
  category: "ID_DOCUMENT",
  title: null,
  coverageId: null,
  contentType: "application/pdf",
  sizeBytes: 4,
  status: "PENDING_UPLOAD",
  clinical: false,
  restricted: false,
  createdAt: "2026-11-19T09:00:00.000Z",
  checkedAt: null,
  removedAt: null,
  removedReason: null,
};

const STARTED = {
  document: DOCUMENT,
  upload: {
    method: "PUT",
    url: "https://storage.example.test/signed",
    headers: { "Content-Type": "application/pdf", "Content-Length": "4" },
    expiresAt: "2026-11-19T09:15:00.000Z",
  },
};

function scannerBusy(): PlatformApiError {
  return new PlatformApiError(
    "Scanner unavailable",
    "SCANNER_UNAVAILABLE",
    null,
    503,
    {},
    null
  );
}

function upload() {
  return uploadDocument({
    patientId: "patient-1",
    request: { category: "ID_DOCUMENT" },
    file: new File(["%PDF"], "id.pdf", { type: "application/pdf" }),
    onStageChange: vi.fn(),
    onProgress: vi.fn(),
  });
}

describe("document upload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clients.post.mockReset();
    clients.put.mockReset();
    clients.put.mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the file to storage with only its content type, then checks it", async () => {
    clients.post
      .mockResolvedValueOnce({ status: 201, data: STARTED })
      .mockResolvedValueOnce({
        status: 200,
        data: { ...DOCUMENT, status: "CLEAN" },
      });

    const document = await upload();

    expect(document.status).toBe("CLEAN");
    expect(clients.put).toHaveBeenCalledWith(
      "https://storage.example.test/signed",
      expect.any(File),
      expect.objectContaining({
        headers: { "Content-Type": "application/pdf" },
      })
    );
    expect(clients.post).toHaveBeenLastCalledWith(
      "/v1/patients/patient-1/documents/document-1/complete",
      {}
    );
  });

  it("tries a busy virus check again before giving up", async () => {
    clients.post
      .mockResolvedValueOnce({ status: 201, data: STARTED })
      .mockRejectedValueOnce(scannerBusy())
      .mockResolvedValueOnce({
        status: 200,
        data: { ...DOCUMENT, status: "CLEAN" },
      });

    const result = upload();
    await vi.runAllTimersAsync();

    expect((await result).status).toBe("CLEAN");
    expect(clients.post).toHaveBeenCalledTimes(3);
  });

  it("explains a scanner that stays busy", async () => {
    clients.post
      .mockResolvedValueOnce({ status: 201, data: STARTED })
      .mockRejectedValue(scannerBusy());

    const result = upload();
    const assertion = expect(result).rejects.toThrow("The virus check is busy");
    await vi.runAllTimersAsync();
    await assertion;
    // One start and three checks.
    expect(clients.post).toHaveBeenCalledTimes(4);
  });

  it("does not check a file that did not finish sending", async () => {
    clients.post.mockResolvedValueOnce({ status: 201, data: STARTED });
    clients.put.mockRejectedValueOnce(new Error("Network Error"));

    await expect(upload()).rejects.toThrow("did not finish sending");
    expect(clients.post).toHaveBeenCalledTimes(1);
  });
});
