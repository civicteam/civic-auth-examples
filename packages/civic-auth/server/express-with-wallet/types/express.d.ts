// This file extends the Express Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      storage: import('../src/app').ExpressCookieStorage;
      civicAuth: import('@civic/auth/server').CivicAuth;
    }
  }
}

export {}; 