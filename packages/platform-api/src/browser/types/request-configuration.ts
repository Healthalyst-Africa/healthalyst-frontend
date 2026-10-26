import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Public calls never attach a bearer token or refresh the session. */
    platformAuthentication?: "public";
    platformAuthenticationRetried?: boolean;
    platformSessionRevision?: number;
    platformIdentityEpoch?: number;
    platformContextScope?: string;
  }
}
