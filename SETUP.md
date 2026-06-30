# Guía de Setup — Pulso ERP

Esta guía te lleva paso a paso para configurar la infraestructura de Pulso ERP desde cero. Al terminar, tendrás la aplicación corriendo localmente con Firebase Auth, PostgreSQL y tu primer usuario admin.

---

## Requisitos previos

- [Node.js 20+](https://nodejs.org/) instalado
- Una cuenta de Google (para Firebase y Gemini)
- Acceso a una base de datos PostgreSQL (local o en la nube)

---

## Paso 1: Clonar e instalar dependencias

```bash
git clone https://github.com/wvictoriag/Pulso-ERP.git
cd Pulso-ERP
npm install
```

---

## Paso 2: Crear tu proyecto en Firebase

Firebase maneja la autenticación de usuarios (login con Google, email/clave, etc.).

### 2.1 Ir a la consola

Abre [https://console.firebase.google.com](https://console.firebase.google.com) e inicia sesión con tu cuenta de Google.

### 2.2 Crear el proyecto

1. Haz clic en **"Add project"** (o "Crear un proyecto")
2. Ponle un nombre, ej: **"Pulso ERP"**
3. Puedes desactivar Google Analytics (no lo necesitamos)
4. Haz clic en **"Create project"**

### 2.3 Registrar la app web

1. En la pantalla del proyecto, haz clic en el ícono **</> (Web)** en la barra superior
2. Registra la app con un nickname, ej: "pulso-erp-web"
3. **Copia los valores de `firebaseConfig`** que te muestra Firebase. Se ven así:

```
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "pulso-erp-xxxxx.firebaseapp.com",
  projectId: "pulso-erp-xxxxx",
  storageBucket: "pulso-erp-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef...",
  measurementId: "G-XXXXXXX"
};
```

4. **NO cierres esta pestaña** — necesitarás estos valores en el Paso 4.

### 2.4 Habilitar Authentication

1. En el menú lateral izquierdo, ve a **Build > Authentication**
2. Haz clic en **"Get started"**
3. Ve a la pestaña **"Sign-in method"**
4. Habilita **"Google"** (recomendado) — selecciona tu email de soporte y guarda
5. (Opcional) Habilita **"Email/Password"** si quieres login manual

### 2.5 Descargar credenciales de Service Account (para el backend)

El backend necesita verificar los tokens de Firebase. Para eso necesita las credenciales de administrador.

1. En el menú lateral, ve a **Project Settings** (ícono de engranaje arriba a la izquierda)
2. Baja hasta la sección **"Service accounts"**
3. Haz clic en **"Generate new private key"**
4. Se descargará un archivo `.json` — **GUÁRDALO SEGURO, no lo compartas**
5. Copia ese archivo a la raíz del proyecto y renómbralo:
   ```
   cp ~/Downloads/tu-proyecto-firebase-adminsdk-xxxxx-xxxxx.json firebase-service-account.json
   ```
6. **IMPORTANTE**: Este archivo ya está en `.gitignore`, así que no se subirá a Git accidentalmente.

---

## Paso 3: Configurar PostgreSQL

Necesitas una base de datos PostgreSQL. Tienes varias opciones:

### Opción A: PostgreSQL local

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb pulso_erp
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb pulso_erp
```

**Windows:** Descarga e instala desde [postgresql.org](https://www.postgresql.org/download/)

### Opción B: PostgreSQL en la nube (recomendado para empezar rápido)

Cualquiera de estos servicios tiene plan gratuito:

| Servicio | Plan Gratuito | Nota |
|----------|--------------|------|
| [Supabase](https://supabase.com) | 500 MB | Incluye panel visual |
| [Neon](https://neon.tech) | 512 MB | Serverless, auto-pause |
| [Railway](https://railway.app) | $5 crédito/mes | Fácil deploy |
| [Render](https://render.com) | 90 días gratis | PostgreSQL managed |

**Ejemplo con Supabase:**
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings > Database**
3. Copia: Host, Database name, User, Password
4. La conexión usa SSL — necesitarás `SQL_SSL=true`

---

## Paso 4: Configurar el archivo .env

```bash
# Copia la plantilla
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
# ---- GEMINI AI (Opcional) ----
# Obtén una API key en https://aistudio.google.com/apikey
GEMINI_API_KEY="AIzaSy..."

# ---- FIREBASE AUTH (CLIENT) ----
# Pega aquí los valores del Paso 2.3
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="pulso-erp-xxxxx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="pulso-erp-xxxxx"
VITE_FIREBASE_STORAGE_BUCKET="pulso-erp-xxxxx.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef..."
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXX"

# ---- FIREBASE ADMIN ----
# Ruta al archivo que descargaste en el Paso 2.5
FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"

# ---- SERVIDOR ----
PORT="3000"
CORS_ORIGIN="http://localhost:3000"

# ---- INVENTARIO ----
LOW_STOCK_THRESHOLD="10"

# ---- POSTGRESQL ----
# Opción A (local):
SQL_HOST="localhost"
SQL_USER="postgres"
SQL_PASSWORD="tu_password"
SQL_DB_NAME="pulso_erp"
SQL_SSL="false"

# Opción B (Supabase/Neon - descomenta y ajusta):
# SQL_HOST="db.tu-proyecto.supabase.co"
# SQL_USER="postgres.tu-proyecto"
# SQL_PASSWORD="tu-password-super-secreto"
# SQL_DB_NAME="postgres"
# SQL_SSL="true"
```

---

## Paso 5: Crear las tablas en la base de datos

Drizzle ORM sincroniza el schema TypeScript con tu PostgreSQL:

```bash
npm run db:push
```

Verás un output como:
```
✔ Tables created: users, productos, clientes, proveedores, pedidos, kardex, finanzas
```

Si ya tenías tablas previas y quieres ver qué cambiaría (sin ejecutar):
```bash
npm run db:push -- --dry-run
```

**Opcional: Explorar la DB visualmente:**
```bash
npm run db:studio
```
Abre [http://localhost:4983](http://localhost:4983) — es un panel para ver/editar tus datos.

---

## Paso 6: Crear tu primer usuario admin

### 6.1 Iniciar sesión en la app por primera vez

1. Arranca la aplicación:
   ```bash
   npm run dev
   ```
2. Abre [http://localhost:3000](http://localhost:3000)
3. Haz clic en **"Iniciar sesión con Google"**
4. Selecciona tu cuenta de Google
5. Puede que veas un error o pantalla vacía — eso es normal. Lo importante es que **ya apareces como usuario en Firebase**.

### 6.2 Obtener tu Firebase UID

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto **"Pulso ERP"**
3. En el menú lateral, ve a **Build > Authentication > Users**
4. Verás tu usuario recién creado. Copia el **UID** (una cadena larga como `aBcDeFgHiJkLmNoPqRsT...`)
5. Anota también tu **email**

### 6.3 Ejecutar el script de seed

```bash
npx tsx src/db/seed.ts TU_FIREBASE_UID tu@email.com
```

Ejemplo:
```bash
npx tsx src/db/seed.ts aBcDeFgHiJkLmNoPqRsT tu@empresa.com
```

Verás:
```
Admin creado exitosamente:
  UID:   aBcDeFgHiJkLmNoPqRsT
  Email: tu@empresa.com
  Rol:   admin
```

### 6.4 Verificar

1. Refresca [http://localhost:3000](http://localhost:3000)
2. Ahora deberías ver el dashboard del ERP con acceso completo

---

## Paso 7: Verificar que todo funciona

Abre la app en [http://localhost:3000](http://localhost:3000) y verifica:

- [ ] Puedes iniciar sesión con Google
- [ ] Ves el dashboard con las estadísticas
- [ ] Puedes navegar por el menú lateral (Productos, Clientes, Pedidos, etc.)
- [ ] El endpoint de salud responde: `curl http://localhost:3000/health`

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run start` | Ejecuta la build de producción |
| `npm run lint` | Verifica tipos TypeScript |
| `npm run db:push` | Sincroniza schema con la DB |
| `npm run db:studio` | Abre panel visual de la DB |
| `npm run db:seed` | Crea usuario admin (necesita args) |

---

## Solución de problemas

### "Error: SQL_HOST must be set in environment variables"
Tu archivo `.env` no existe o no está en la raíz del proyecto. Ejecuta `cp .env.example .env` y edítalo.

### "No se pudo inicializar Firebase Admin"
El archivo `firebase-service-account.json` no existe o la ruta en `.env` es incorrecta. Verifica el Paso 2.5.

### "Unauthorized: Invalid token" al hacer peticiones
Las credenciales del Firebase Admin SDK no coinciden con el proyecto de Firebase del cliente. Verifica que `VITE_FIREBASE_PROJECT_ID` y el `project_id` dentro del JSON de service account sean el mismo.

### "connection refused" o "ECONNREFUSED" en PostgreSQL
- Verifica que PostgreSQL esté corriendo
- Verifica host, puerto y credenciales en `.env`
- Si usas Supabase/Neon, asegúrate de tener `SQL_SSL=true`

### "permission denied" al correr `npm run db:push`
Verifica que el usuario de PostgreSQL tenga permisos para crear tablas en la base de datos.

---

## Arquitectura de la configuración

```
Pulso-ERP/
├── .env                    ← Tus credenciales reales (NUNCA en Git)
├── .env.example            ← Plantilla (SÍ en Git)
├── firebase-service-account.json  ← Credenciales admin de Firebase (NUNCA en Git)
├── drizzle.config.ts       ← Config de Drizzle para migraciones
├── src/
│   ├── lib/
│   │   ├── firebase.ts     ← Config del CLIENTE (usa VITE_*)
│   │   └── firebase-admin.ts  ← Config del SERVIDOR (usa service account)
│   ├── db/
│   │   ├── schema.ts       ← Definición de tablas (TypeScript)
│   │   ├── index.ts        ← Conexión a PostgreSQL
│   │   └── seed.ts         ← Script para crear usuario admin
│   └── middleware/
│       └── auth.ts         ← Verificación de tokens en cada request
```