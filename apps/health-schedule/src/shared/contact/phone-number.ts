import { PHONE_COUNTRY_CODE } from "~/config/phone";

/**
 * A phone number in the international format the API stores, such as
 * +2348031234567. Accepts local Nigerian numbers (0803 123 4567), numbers
 * with the country code and spaces, dashes or brackets. Null when it cannot
 * be a phone number.
 */
export function toInternationalPhoneNumber(input: string): string | null {
  const trimmedInput = input.trim();
  const digits = trimmedInput.replace(/[\s()-]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  let internationalNumber: string;
  if (digits.startsWith("+")) {
    internationalNumber = digits;
  } else if (digits.startsWith("0")) {
    internationalNumber = `+${PHONE_COUNTRY_CODE}${digits.slice(1)}`;
  } else if (digits.startsWith(PHONE_COUNTRY_CODE)) {
    internationalNumber = `+${digits}`;
  } else {
    return null;
  }
  return /^\+[1-9]\d{7,14}$/.test(internationalNumber)
    ? internationalNumber
    : null;
}
