import { Storage } from '@civic/auth/server';

declare global {
  namespace Express {
    interface Request {
      storage: Storage;
    }
  }
}
