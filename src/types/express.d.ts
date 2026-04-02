import { JwtPayload } from './index';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User {}
    interface Request {
      user?: JwtPayload;
    }
  }
}
