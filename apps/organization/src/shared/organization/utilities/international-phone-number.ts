/**
 * Accepts a Nigerian number as people usually write it and returns it in
 * E.164: `0803 123 4567` and `234 803 123 4567` both become `+2348031234567`.
 * Other international numbers must already start with a plus sign.
 */
export function toInternationalPhoneNumber(phoneNumber: string): string {
  const compactNumber = phoneNumber.replace(/[\s().-]/g, "");
  if (/^0\d{10}$/.test(compactNumber)) {
    return `+234${compactNumber.slice(1)}`;
  }
  if (/^234\d{10}$/.test(compactNumber)) {
    return `+${compactNumber}`;
  }
  return compactNumber;
}
