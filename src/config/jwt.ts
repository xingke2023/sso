import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export const JWT_ACCESS_EXPIRES = '15m';
export const JWT_REFRESH_DAYS = 7;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_ACCESS_EXPIRES });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
