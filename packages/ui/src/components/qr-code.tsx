import { QRCodeSVG as QuickResponseCodeImage } from "qrcode.react";
import { cn } from "@healthalyst/ui/lib/utilities";

type QrCodeProperties = {
  /** The text the code holds, such as an `otpauth://` address. */
  value: string;
  /** What the code is for, read by assistive technology. */
  label: string;
  /** Width and height in pixels. */
  size?: number;
  className?: string;
};

/**
 * A QR code drawn as SVG, dark on a white tile with a quiet zone so phone
 * cameras read it on any background.
 */
export function QrCode({
  value,
  label,
  size = 176,
  className,
}: QrCodeProperties) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-white p-3",
        className
      )}
    >
      <QuickResponseCodeImage
        value={value}
        size={size}
        level="M"
        role="img"
        aria-label={label}
        title={label}
      />
    </div>
  );
}
