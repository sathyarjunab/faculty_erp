/**
 * Augments Express' Request with the authenticated teacher set by auth middleware.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

export {};
