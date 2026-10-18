import type { DecodedIdToken } from 'firebase-admin/auth';
import type { HydratedDocument } from 'mongoose';
import type { UserRecord } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: DecodedIdToken;
      appUser?: HydratedDocument<UserRecord>;
    }
  }
}

export {};
