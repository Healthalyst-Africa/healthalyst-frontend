// Checked in order: Edge and Opera also name Chrome, and Chrome names Safari.
const BROWSER_PATTERNS = [
  { name: "Edge", pattern: /Edg(e|A|iOS)?\// },
  { name: "Opera", pattern: /OPR\/|Opera/ },
  { name: "Firefox", pattern: /Firefox\/|FxiOS\// },
  { name: "Chrome", pattern: /Chrome\/|CriOS\// },
  { name: "Safari", pattern: /Safari\// },
] as const;

// Android and iOS user agents also mention Linux and macOS.
const OPERATING_SYSTEM_PATTERNS = [
  { name: "Android", pattern: /Android/ },
  { name: "iPhone", pattern: /iPhone/ },
  { name: "iPad", pattern: /iPad/ },
  { name: "Windows", pattern: /Windows/ },
  { name: "macOS", pattern: /Mac OS X|Macintosh/ },
  { name: "ChromeOS", pattern: /CrOS/ },
  { name: "Linux", pattern: /Linux/ },
] as const;

/** A readable device name from a browser's user agent, such as "Chrome on Windows". */
export function describeSessionDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = BROWSER_PATTERNS.find((candidate) =>
    candidate.pattern.test(userAgent)
  )?.name;
  const operatingSystem = OPERATING_SYSTEM_PATTERNS.find((candidate) =>
    candidate.pattern.test(userAgent)
  )?.name;
  if (browser && operatingSystem) return `${browser} on ${operatingSystem}`;
  return browser ?? operatingSystem ?? "Unknown device";
}
