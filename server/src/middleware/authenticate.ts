import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { upsertUser } from '../data/repository.js';
import { AppError } from '../lib/AppError.js';
import { verifyFirebaseIdToken } from '../lib/firebaseToken.js';

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(401, 'A Firebase ID token is required.');
    }

    const decodedToken = await verifyFirebaseIdToken(authorization.slice(7));
    const provider = decodedToken.firebase?.sign_in_provider ?? '';

    if (!env.allowedAuthProviders.includes(provider)) {
      throw new AppError(403, `The ${provider || 'unknown'} sign-in provider is not enabled.`);
    }

    const email = decodedToken.email?.trim().toLowerCase();
    if (!email) {
      throw new AppError(403, 'The selected provider did not supply an email address.');
    }

    const role = env.adminEmails.includes(email) ? 'admin' : 'seller';
    const appUser = await upsertUser({
      firebaseUid: decodedToken.uid,
      email,
      displayName: decodedToken.name ?? '',
      photoUrl: decodedToken.picture ?? '',
      authProvider: provider,
      role,
    });

    request.firebaseUser = decodedToken;
    request.appUser = appUser;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Authentication failed.'));
  }
}

export function requireAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.appUser?.role !== 'admin') {
    next(new AppError(403, 'Administrator access is required.'));
    return;
  }
  next();
}
