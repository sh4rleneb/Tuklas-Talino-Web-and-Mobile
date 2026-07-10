import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { setRealtime } from './realtime.js';
import { syncModels } from './models/index.js';

import { connectDatabase } from './config/database.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '2mb';
const apiRateLimitWindowMs = Number.parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10);
const apiRateLimitMax = Number.parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10);

const app = express();

app.disable('x-powered-by');

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.APP_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: apiRateLimitWindowMs,
  limit: apiRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: 429,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests. Please try again later.'
  }
});

app.use('/api', apiLimiter);

app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit, parameterLimit: 100 }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(uploadsDir));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
setRealtime(io);



app.use('/api', apiRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error(err);

  if (err.type === 'entity.too.large' || err.type === 'parameters.too.many' || err.status === 413 || err.statusCode === 413) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: `Request body is too large. Maximum allowed size is ${requestBodyLimit}.`
    });
  }

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    message: err.message || 'Internal server error.',
    details: err.details || undefined
  });
});

const port = Number(process.env.PORT || 4000);
const bindHost = process.env.BIND_HOST || '127.0.0.1';

connectDatabase()
  .then(async() => {
    await syncModels();
    server.listen(port, bindHost, () =>
      console.log(`Tuklas Talino API running on http://${bindHost}:${port}`)
    );
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// lessonSchemaLockApplied=true
