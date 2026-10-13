import axios from "axios";

const accountsApiAddress = process.env.NEXT_PUBLIC_HEALTHALYST_API_URL?.trim();

export class AccountsApiConfigurationError extends Error {
  constructor() {
    super(
      "HealthAlyst connection is not configured. Contact your administrator."
    );
    this.name = "AccountsApiConfigurationError";
  }
}

const accountsHttpClient = accountsApiAddress
  ? axios.create({
      baseURL: accountsApiAddress.replace(/\/$/, ""),
      timeout: 10_000,
      withCredentials: false,
      headers: { "Content-Type": "application/json" },
    })
  : null;

export function getAccountsHttpClient() {
  if (!accountsHttpClient) {
    throw new AccountsApiConfigurationError();
  }

  return accountsHttpClient;
}
