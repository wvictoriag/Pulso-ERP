import { initializeApp, getApps, AppOptions, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

function buildFirebaseAdminConfig(): AppOptions {
  // Prioridad 1: GOOGLE_APPLICATION_CREDENTIALS (estándar de Google Cloud)
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath && fs.existsSync(gacPath)) {
    const serviceAccount = require(gacPath);
    return { credential: cert(serviceAccount) };
  }

  // Prioridad 2: FIREBASE_SERVICE_ACCOUNT_PATH (específico del .env)
  const fsaPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (fsaPath && fs.existsSync(path.resolve(process.cwd(), fsaPath))) {
    const serviceAccount = require(path.resolve(process.cwd(), fsaPath));
    return { credential: cert(serviceAccount) };
  }

  // Prioridad 3: Si existe firebase-service-account.json en la raíz del proyecto
  const localPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(localPath)) {
    const serviceAccount = require(localPath);
    return { credential: cert(serviceAccount) };
  }

  // Fallback: solo projectId (requiere que las credenciales estén en el entorno de Google Cloud)
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId) {
    console.warn(
      '[firebase-admin] No se encontró archivo de credenciales. ' +
      'Usando projectId únicamente. Esto funciona si la app corre en Google Cloud ' +
      'o si GOOGLE_APPLICATION_CREDENTIALS está configurado en el sistema.'
    );
    return { projectId };
  }

  throw new Error(
    '[firebase-admin] No se pudo inicializar Firebase Admin. ' +
    'Configura FIREBASE_SERVICE_ACCOUNT_PATH o GOOGLE_APPLICATION_CREDENTIALS en tu .env.local. ' +
    'Instrucciones en SETUP.md'
  );
}

if (!getApps().length) {
  initializeApp(buildFirebaseAdminConfig());
}

export const adminAuth = getAuth();

