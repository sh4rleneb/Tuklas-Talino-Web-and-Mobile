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

const app = express();

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

app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
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
  const status = err.statusCode || 500;

  res.status(status).json({
    message: err.message || 'Internal server error.',
    details: err.details || undefined
  });
});

const port = Number(process.env.PORT || 4000);

connectDatabase()
  .then(async() => {
    await syncModels();
    server.listen(port, () =>
      console.log(`Tuklas Talino API running on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
