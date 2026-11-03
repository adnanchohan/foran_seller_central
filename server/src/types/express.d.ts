import type { AppUser } from '../data/types.js';
import type { FirebaseIdentity } from '../lib/firebaseToken.js';

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseIdentity;
      appUser?: AppUser;
    }
  }
}

export {};
