import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { apiRouter } from './src/routes/api';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

async function startServer() {
  const app = express();

  // Cabeceras de seguridad Helmet
  // En producción: CSP activo con política real. En desarrollo: desactivado para Vite HMR.
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS restringido al origen configurado
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (ej: server-to-server, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Limitador de tasa de peticiones para la API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300,
    message: { error: 'Demasiadas solicitudes desde esta IP, intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.use('/api', apiRouter);

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} recibido. Cerrando servidor gracefully...`);
    server.close(() => {
      console.log('Servidor cerrado correctamente.');
      process.exit(0);
    });
    // Forzar cierre tras 10s si no se cierra solo
    setTimeout(() => {
      console.error('Forzando cierre tras timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
