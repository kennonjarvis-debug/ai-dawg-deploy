import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: {
        csrfSecret?: string;
        csrfToken?: string;
        csrfTokens?: string[];
      };
      csrfToken?(): string;
    }
  }
}

export {};
