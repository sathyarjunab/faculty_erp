import jwt, { SignOptions } from 'jsonwebtoken';
import type { AppConfig } from '../config/env';

export interface TokenPayload {
  sub: number;
  email: string;
}

/**
 * JWT signing/verification. Access tokens are short-lived; refresh tokens
 * are long-lived and used only by the /auth/refresh endpoint.
 */
export const makeTokenService = ({ config, jwt: jwtLib }: { config: AppConfig; jwt: typeof jwt }) => {
  const accessOpts: SignOptions = { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] };
  const refreshOpts: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] };

  const signAccessToken = (payload: TokenPayload): string =>
    jwtLib.sign(payload, config.jwt.accessSecret, accessOpts);

  const signRefreshToken = (payload: TokenPayload): string =>
    jwtLib.sign(payload, config.jwt.refreshSecret, refreshOpts);

  const verifyAccessToken = (token: string): TokenPayload =>
    jwtLib.verify(token, config.jwt.accessSecret) as unknown as TokenPayload;

  const verifyRefreshToken = (token: string): TokenPayload =>
    jwtLib.verify(token, config.jwt.refreshSecret) as unknown as TokenPayload;

  return { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
};

export type TokenService = ReturnType<typeof makeTokenService>;
