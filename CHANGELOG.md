# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [1.2.0] - 2026-07-01

### Añadido
- **SETUP.md**: Guía completa paso a paso para configurar Firebase, PostgreSQL y el primer usuario admin desde cero.
- **Scripts npm de base de datos**: `db:push`, `db:generate`, `db:studio`, `db:seed` para operar la DB sin comandos largos.
- **Soporte SSL en PostgreSQL**: Variables `SQL_SSL` en `.env`, `drizzle.config.ts` y `src/db/index.ts` soportan conexiones SSL (necesario para Supabase, Neon, etc.).
- **Resolución inteligente de credenciales Firebase Admin**: `firebase-admin.ts` busca en 3 ubicaciones: `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_PATH`, y `firebase-service-account.json` local.

### Corregido
- **Firebase Admin hardcodeado**: Se eliminó el proyecto `gen-lang-client-0038484757` hardcodeado. Ahora siempre usa credenciales propias del usuario o lanza error claro con instrucciones.
- **Config de Drizzle duplicada**: Se eliminó `src/db/drizzle.config.ts` conflictivo. Solo queda `drizzle.config.ts` en la raíz con variables consistentes.
- **`.gitignore` incompleto**: Se añadió `firebase-service-account.json` para evitar subir credenciales al repositorio.

### Cambiado
- **Nombre del paquete**: Cambiado de `react-example` a `pulso-erp` en `package.json`.
- **Versión**: Actualizada a `1.2.0`.
- **`.env.example` ampliado**: Ahora incluye `SQL_SSL`, instrucciones para Supabase/Neon, y explicación de las dos opciones para credenciales de Firebase Admin.

## [1.1.0] - 2026-06-30

### Corregido (Bloqueantes Críticos)
- **CORS restringido**: Se eliminó `cors()` abierto. Ahora usa `CORS_ORIGIN` desde `.env` con lista blanca de orígenes permitidos.
- **Content-Security-Policy**: Helmet CSP ahora está activo en producción. Solo se desactiva en desarrollo para compatibilidad con Vite HMR.
- **Stock negativo bloqueado**: `adjustStock()` ahora lanza error si una salida de inventario deja el stock por debajo de 0. Se devuelve HTTP 400 con mensaje claro.
- **Archivos de prueba eliminados**: Se removieron `test3.ts` hasta `test8.ts` y la carpeta `app/applet/` del repositorio.

### Añadido (Alta Prioridad)
- **Health check**: Nuevo endpoint `GET /health` que responde `{ status: 'ok', timestamp }` para orquestadores (Railway, Render, Docker).
- **Graceful shutdown**: El servidor maneja señales `SIGTERM` y `SIGINT` cerrando conexiones limpiamente antes de salir.
- **Paginación**: `GET /api/table/:tableName` ahora acepta `?page=1&limit=50` y retorna metadata de paginación (`page`, `limit`, `total`, `totalPages`).
- **Campo `stockMinimo`**: Nuevo campo en la tabla `productos` para definir umbral de stock bajo por producto (por defecto 10).
- **Umbral configurable**: La variable `LOW_STOCK_THRESHOLD` en `.env` permite cambiar el umbral global de stock bajo. El endpoint `/stats` usa `stockMinimo` por producto si está definido.

### Cambiado
- **Fechas como tipo `date`**: Los campos `fecha` en `pedidos`, `kardex` y `finanzas` migraron de `text` a `date` nativo de PostgreSQL. Requiere ejecutar `npx drizzle-kit generate` y `npx drizzle-kit push`.
- **Stats optimizado con SQL**: `GET /api/stats` usa `COUNT()` y `SUM()` de SQL en vez de cargar toda la tabla en memoria.
- **PORT configurable**: El puerto del servidor ahora se lee de `process.env.PORT` (por defecto 3000).
- **Manejo de errores de stock**: Los errores de stock insuficiente se propagan al frontend con HTTP 400 y mensaje descriptivo.

## [1.0.0] - 2026-06-25

### Añadido
- Inicialización del archivo `CHANGELOG.md` para registro de auditoría de cambios.
- Esquemas de validación de datos con Zod para Clientes, Proveedores, Productos, Pedidos, Finanzas y Kárdex (`src/lib/validation.ts`).
- Middleware de autorización `requireRole` para validar permisos basados en roles (`src/middleware/auth.ts`).
- Configuración para Drizzle Kit (`drizzle.config.ts`) para sincronización del esquema local.

### Cambiado
- Migración de la configuración de Firebase (Client y Admin) para usar variables de entorno en lugar de archivos JSON expuestos (`src/lib/firebase.ts`, `src/lib/firebase-admin.ts`).
- Modificación de endpoints `POST` y `PUT` en `src/routes/api.ts` para integrar validación estricta con Zod.
- Refactorización de operaciones de inventario y pedidos para ejecutarse bajo transacciones SQL (`db.transaction`) atómicas en PostgreSQL, garantizando consistencia.
- Habilitación de Helmet, CORS y Rate Limiting en el servidor Express (`server.ts`) para protección contra DoS y cabeceras seguras.
- Actualización de la tabla `users` para incluir el rol del usuario, y del middleware `requireAuth` para inyectar este rol consultando PostgreSQL.
- Rediseño del componente `ImportWizard.tsx` para eliminar datos hardcodeados de la empresa y permitir la importación masiva únicamente mediante pegado TSV/Google Sheets.
- Configuración de variables de entorno requeridas en `.env.example` y creación del archivo local `.env`.

