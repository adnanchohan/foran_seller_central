import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { onboardingRouter } from './routes/onboarding.routes.js';
import { paymentRouter } from './routes/payment.routes.js';
import { uploadRouter } from './routes/upload.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

app.get('/api/v1/health', (_request, response) => {
  response.json({ status: 'ok', service: 'foran-seller-central-api' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
