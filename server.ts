import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { apiRouter } from './src/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cabeceras de seguridad Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Evita conflictos con Vite HMR y recursos dinámicos en local
    crossOriginEmbedderPolicy: false,
  }));

  // Habilitar CORS
  app.use(cors());

  app.use(express.json({ limit: '50mb' }));

  // Limitador de tasa de peticiones para la API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Límite generoso de 300 peticiones por ventana por IP
    message: { error: 'Demasiadas solicitudes desde esta IP, intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

