import express from 'express';
import cors from 'cors';
import passport from './config/passport';
import router from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use('/api', router);
app.use(errorHandler);

export default app;
