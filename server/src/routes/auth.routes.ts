import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';

export const authRouter = Router();

authRouter.get('/session', authenticate, (request, response) => {
  response.json({ user: request.appUser });
});
