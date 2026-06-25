import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
  cookies: Record<string, string | undefined>;
}

export interface OptionalAuthRequest extends Request {
  user?: JwtPayload;
  cookies: Record<string, string | undefined>;
}
