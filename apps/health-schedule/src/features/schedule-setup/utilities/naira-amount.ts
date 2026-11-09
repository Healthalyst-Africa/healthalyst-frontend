const NAIRA_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

/** Naira text such as "1500" or "1500.50" in kobo, or null when empty. */
export function nairaTextToKobo(nairaText: string): number | null {
  const trimmedText = nairaText.trim().replaceAll(",", "");
  if (!trimmedText) return null;
  const [wholeNaira = "0", fractionText = ""] = trimmedText.split(".");
  return Number(wholeNaira) * 100 + Number(fractionText.padEnd(2, "0"));
}

/** Kobo as editable naira text, such as "1500.50", or "" when there is no price. */
export function koboToNairaText(kobo: number | null): string {
  if (kobo === null) return "";
  const wholeNaira = Math.floor(kobo / 100);
  const remainingKobo = kobo % 100;
  return remainingKobo === 0
    ? String(wholeNaira)
    : `${wholeNaira}.${String(remainingKobo).padStart(2, "0")}`;
}

/** Kobo as a displayed price, such as "₦1,500.00". */
export function formatNaira(kobo: number): string {
  return NAIRA_FORMATTER.format(kobo / 100);
}
