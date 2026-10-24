"use client";

import { useState } from "react";
import { RECOVERY_CODES_FILE_NAME } from "~/features/authentication/config/authenticator-enrolment";
import {
  copyText,
  downloadRecoveryCodesFile,
} from "~/features/authentication/utilities/authenticator-enrolment";
export function useRecoveryCodeExport(recoveryCodes: readonly string[]) {
  const [hasSavedCodes, setHasSavedCodes] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  function downloadRecoveryCodes() {
    downloadRecoveryCodesFile(recoveryCodes);
    setSaveStatus(`Downloaded ${RECOVERY_CODES_FILE_NAME}.`);
  }
  async function copyRecoveryCodes() {
    setSaveStatus(
      (await copyText(recoveryCodes.join("\n")))
        ? "Recovery codes copied."
        : "Copying is not available here. Download the codes instead."
    );
  }
  return {
    hasSavedCodes,
    setHasSavedCodes,
    saveStatus,
    downloadRecoveryCodes,
    copyRecoveryCodes,
  };
}
