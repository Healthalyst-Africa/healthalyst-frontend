import { TOUR_OFFER_STORAGE_PREFIX } from "~/features/guided-tours/config/guided-tours";

function storageName(userIdentifier: string): string {
  return `${TOUR_OFFER_STORAGE_PREFIX}:${userIdentifier}`;
}

/**
 * Whether this person has answered the tour offer on this device. A
 * convenience only: without storage the offer may appear again.
 */
export function hasAnsweredTourOffer(userIdentifier: string): boolean {
  try {
    return window.localStorage.getItem(storageName(userIdentifier)) !== null;
  } catch {
    return false;
  }
}

/** Remembers that the offer was taken or declined, so it is not shown again. */
export function rememberTourOfferAnswer(
  userIdentifier: string,
  answer: "taken" | "declined"
) {
  try {
    window.localStorage.setItem(storageName(userIdentifier), answer);
  } catch {
    // Without storage, the offer may appear again next time.
  }
}
