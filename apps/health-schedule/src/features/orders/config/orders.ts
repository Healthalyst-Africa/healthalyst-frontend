import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";
import {
  ArrivedIcon,
  AwaitingPaymentIcon,
  CancelOrderIcon,
  CheckingResultIcon,
  CoverConfirmedIcon,
  CriticallyHighIcon,
  CriticallyLowIcon,
  CriticalResultIcon,
  HighResultIcon,
  ImmediatePriorityIcon,
  InProgressIcon,
  LowResultIcon,
  NothingFlaggedIcon,
  OrderedIcon,
  OutsideRangeIcon,
  PaidIcon,
  RecentlyDoneIcon,
  RetakeSampleIcon,
  ReviewResultsIcon,
  RoutineIcon,
  SampleTakenIcon,
  SwitchOffIcon,
  SwitchOnIcon,
  UrgentIcon,
} from "@healthalyst/icons";

/** HealthSchedule API paths for the test catalogue, orders and results. */
export const ORDER_ENDPOINTS = {
  catalogue: "/v1/order-catalogue",
  starterCatalogue: "/v1/order-catalogue/starter",
  catalogueItem: (serviceId: string) =>
    `/v1/order-catalogue/${encodeURIComponent(serviceId)}`,
  patientOrders: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/orders`,
  order: (orderId: string) => `/v1/orders/${encodeURIComponent(orderId)}`,
  orderRevisions: (orderId: string) =>
    `/v1/orders/${encodeURIComponent(orderId)}/revisions`,
  cancelOrder: (orderId: string) =>
    `/v1/orders/${encodeURIComponent(orderId)}/cancel`,
  acknowledgeOrder: (orderId: string) =>
    `/v1/orders/${encodeURIComponent(orderId)}/acknowledge`,
  resultsInbox: "/v1/inbox/results",
} as const;

export const ORDER_PERMISSIONS = {
  /** Doctors, house officers and midwives order and review their results. */
  create: "order:create",
  /** A patient's orders and results are part of the clinical record. */
  readResults: "note:read",
  /** Anyone who can see patients can see what the facility offers. */
  readCatalogue: "patient:read",
  /** The setup pages. */
  readSetup: "schedule:read",
  /** Adding the starter tests and switching tests on or off. */
  manageCatalogue: "schedule:manage",
} as const;

export const ORDER_KIND_LABELS = {
  LAB: "Lab",
  IMAGING: "Imaging",
} as const;

export const ORDER_PRIORITY_OPTIONS = [
  {
    value: "ROUTINE",
    label: "Routine",
    description: "Done in turn.",
  },
  {
    value: "URGENT",
    label: "Urgent",
    description: "Ahead of routine work.",
  },
  {
    value: "STAT",
    label: "STAT",
    description: "Now, ahead of everything else.",
  },
] as const;

export const ORDER_PRIORITY_PRESENTATION = {
  ROUTINE: { label: "Routine", tone: "neutral", icon: RoutineIcon },
  URGENT: { label: "Urgent", tone: "warning", icon: UrgentIcon },
  STAT: { label: "STAT", tone: "negative", icon: ImmediatePriorityIcon },
} as const satisfies Record<string, StatusPresentation>;

export const RESULT_FLAG_PRESENTATION = {
  LOW: { label: "Low", tone: "warning", icon: LowResultIcon },
  HIGH: { label: "High", tone: "warning", icon: HighResultIcon },
  CRITICAL_LOW: {
    label: "Critically low",
    tone: "negative",
    icon: CriticallyLowIcon,
  },
  CRITICAL_HIGH: {
    label: "Critically high",
    tone: "negative",
    icon: CriticallyHighIcon,
  },
  ABNORMAL: { label: "Abnormal", tone: "warning", icon: OutsideRangeIcon },
} as const satisfies Record<string, StatusPresentation>;

/** Only charges the patient must act on are shown with the order. */
export const ORDER_PAYMENT_PRESENTATION = {
  NO_CHARGE: null,
  COVERED: {
    label: "Covered by insurance",
    tone: "positive",
    icon: CoverConfirmedIcon,
  },
  PAID: { label: "Paid", tone: "positive", icon: PaidIcon },
  AWAITING_PAYMENT: {
    label: "Waiting for payment",
    tone: "warning",
    icon: AwaitingPaymentIcon,
  },
} as const satisfies Record<string, StatusPresentation | null>;

/** Each stage of an order, and how its result reads, as tags. */
export const ORDER_TAGS = {
  ordered: { label: "Ordered", tone: "neutral", icon: OrderedIcon },
  retakeSample: {
    label: "Sample to take again",
    tone: "warning",
    icon: RetakeSampleIcon,
  },
  patientArrived: {
    label: "Patient arrived",
    tone: "information",
    icon: ArrivedIcon,
  },
  sampleTaken: {
    label: "Sample taken",
    tone: "information",
    icon: SampleTakenIcon,
  },
  inProgress: {
    label: "In progress",
    tone: "information",
    icon: InProgressIcon,
  },
  checkingResult: {
    label: "Result being checked",
    tone: "information",
    icon: CheckingResultIcon,
  },
  resultReady: {
    label: "Result ready",
    tone: "positive",
    icon: ReviewResultsIcon,
  },
  cancelled: { label: "Cancelled", tone: "neutral", icon: CancelOrderIcon },
  critical: { label: "Critical", tone: "negative", icon: CriticalResultIcon },
  criticalResult: {
    label: "Critical result",
    tone: "negative",
    icon: CriticalResultIcon,
  },
  outsideRange: {
    label: "Outside range",
    tone: "warning",
    icon: OutsideRangeIcon,
  },
  resultOutsideRange: {
    label: "Result outside range",
    tone: "warning",
    icon: OutsideRangeIcon,
  },
  nothingFlagged: {
    label: "Nothing flagged",
    tone: "neutral",
    icon: NothingFlaggedIcon,
  },
  alreadyOrdered: {
    label: "Already ordered",
    tone: "warning",
    icon: OrderedIcon,
  },
  doneRecently: {
    label: "Done recently",
    tone: "warning",
    icon: RecentlyDoneIcon,
  },
  orderable: { label: "On", tone: "positive", icon: SwitchOnIcon },
  notOrderable: { label: "Off", tone: "neutral", icon: SwitchOffIcon },
} as const satisfies Record<string, StatusPresentation>;

/** Marks a waiting patient whose results are back. */
export const RESULTS_READY_TAG = {
  label: "Results ready",
  tone: "information",
  icon: ReviewResultsIcon,
} as const satisfies StatusPresentation;

export const SPECIMEN_LABELS = {
  BLOOD: "Blood",
  URINE: "Urine",
  STOOL: "Stool",
  SPUTUM: "Sputum",
  SWAB: "Swab",
  CSF: "Spinal fluid",
  OTHER: "Other sample",
} as const;

/**
 * Tests most clinics order daily, offered as one-tap choices when the
 * facility's catalogue has them. Codes from the backend's starter catalogue.
 */
export const COMMON_ORDER_CODES = [
  "FBC",
  "MRDT",
  "MPS",
  "RBS",
  "UA",
  "CXR",
] as const;

export const ORDER_LIMITS = {
  /** Tests and scans sent together. */
  itemsPerOrder: 20,
  indication: 1000,
  cancelReason: { minimum: 3, maximum: 500 },
  /** Search results shown under the search box. */
  searchResults: 8,
} as const;

/**
 * A test with a released result from this many days ago or fewer is shown
 * beside the new order, so the doctor can use it instead of repeating it.
 */
export const RECENT_RESULT_DAYS = 7;

/** The results inbox is checked again this often while it is open. */
export const RESULTS_INBOX_REFRESH_MILLISECONDS = 30_000;
