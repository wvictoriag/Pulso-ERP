# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

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

