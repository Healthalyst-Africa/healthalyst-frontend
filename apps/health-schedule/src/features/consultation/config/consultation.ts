/** Seeing patients needs the queue and the right to write doctors' notes. */
export const CONSULTATION_PERMISSIONS = {
  readQueues: "queue:read",
  manageQueues: "queue:manage",
  writeNotes: "note:write",
} as const;

/** The queue value for every doctor's shared queue. */
export const SHARED_DOCTORS_QUEUE_VALUE = "CONSULTATION";
