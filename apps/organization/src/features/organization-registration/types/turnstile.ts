export type TurnstileRenderOptions = {
  sitekey: string;
  callback: (responseToken: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  retry: "auto" | "never";
  "refresh-expired": "auto" | "manual" | "never";
  "refresh-timeout": "auto" | "manual" | "never";
};

export type TurnstileClient = {
  render: (
    containerElement: HTMLElement,
    renderOptions: TurnstileRenderOptions
  ) => string;
  reset: (widgetIdentifier: string) => void;
  remove: (widgetIdentifier: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileClient;
  }
}

export type TurnstileChallengeProperties = {
  onResponseTokenChange: (responseToken: string | null) => void;
  siteKey: string | undefined;
};

export type VerificationStatus =
  "loading" | "ready" | "complete" | "expired" | "error";
