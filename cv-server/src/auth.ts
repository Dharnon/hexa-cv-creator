import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
}

const FOURTEEN_DAYS_SEC = 14 * 24 * 60 * 60;

export function signToken(payload: JwtPayload, secret: string, expiresInSec = FOURTEEN_DAYS_SEC): string {
  return jwt.sign(payload, secret, { expiresIn: expiresInSec });
}

export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
