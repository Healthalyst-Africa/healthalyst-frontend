import { z as schema } from "zod";

export const ACCESS_TOKEN_RESPONSE_SCHEMA = schema.object({
  accessToken: schema.string().min(1),
  expiresIn: schema.number().int().positive(),
});
export const ENCRYPTED_SESSION_SCHEMA = schema.object({
  accessToken: schema.string().min(1),
  accessTokenExpiresAt: schema.number().int().positive(),
  refreshToken: schema.string().min(1),
  refreshTokenExpiresAt: schema.number().int().positive(),
});
