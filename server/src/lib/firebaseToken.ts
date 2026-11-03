import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env.js';

const firebaseSigningKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

interface FirebaseTokenPayload extends JWTPayload {
  email?: string;
  name?: string;
  picture?: string;
  auth_time?: number;
  firebase?: {
    sign_in_provider?: string;
  };
}

export interface FirebaseIdentity extends FirebaseTokenPayload {
  uid: string;
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity> {
  const { payload } = await jwtVerify<FirebaseTokenPayload>(token, firebaseSigningKeys, {
    algorithms: ['RS256'],
    audience: env.firebaseProjectId,
    issuer: `https://securetoken.google.com/${env.firebaseProjectId}`,
    requiredClaims: ['exp', 'iat', 'aud', 'iss', 'sub', 'auth_time'],
    clockTolerance: 5,
  });

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || payload.sub.length > 128) {
    throw new Error('Firebase token subject is invalid.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > now + 5) {
    throw new Error('Firebase token issue time is invalid.');
  }
  if (typeof payload.auth_time !== 'number' || payload.auth_time > now + 5) {
    throw new Error('Firebase authentication time is invalid.');
  }

  return { ...payload, uid: payload.sub };
}
