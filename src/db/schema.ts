import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('user').notNull(), // 'admin' o 'user'
  createdAt: timestamp('created_at').defaultNow(),
});

export const productos = pgTable('productos', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  categoria: text('categoria'),
  precio: integer('precio').notNull().default(0),
  costo: integer('costo').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  esKit: boolean('es_kit').notNull().default(false),
  componentesKit: jsonb('componentes_kit').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  rut: text('rut'),
  giro: text('giro'),
  direccion: text('direccion'),
  ciudad: text('ciudad'),
  contactoNombre: text('contacto_nombre'),
  contactoEmail: text('contacto_email'),
  tipoCliente: text('tipo_cliente'),
  condicionPago: text('condicion_pago'),
  telefono: text('telefono'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const proveedores = pgTable('proveedores', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  rut: text('rut'),
  giro: text('giro'),
  direccion: text('direccion'),
  ciudad: text('ciudad'),
  condicionPago: text('condicion_pago'),
  moneda: text('moneda'),
  telefono: text('telefono'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pedidos = pgTable('pedidos', {
  id: serial('id').primaryKey(),
  numeroOc: text('numero_oc'),
  clienteId: integer('cliente_id').references(() => clientes.id),
  solicitanteNombre: text('solicitante_nombre'),
  solicitanteEmail: text('solicitante_email'),
  estado: text('estado').default('💬 Cotización'),
  canal: text('canal').default('Directo'),
  estadoPago: text('estado_pago').default('⏳ Pendiente'),
  fecha: text('fecha').notNull(),
  items: jsonb('items').notNull().default('[]'),
  subtotal: integer('subtotal').notNull().default(0),
  iva: integer('iva').notNull().default(0),
  total: integer('total').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const kardex = pgTable('kardex', {
  id: serial('id').primaryKey(),
  productoId: integer('producto_id').references(() => productos.id).notNull(),
  tipoMovimiento: text('tipo_movimiento').notNull(), // Entrada, Salida
  motivo: text('motivo').notNull(), // Venta, Ajuste, Devolución, Merma
  cantidad: integer('cantidad').notNull(),
  fecha: text('fecha').notNull(),
  usuario: text('usuario'),
  pedidoId: integer('pedido_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const finanzas = pgTable('finanzas', {
  id: serial('id').primaryKey(),
  descripcion: text('descripcion').notNull(),
  tipo: text('tipo').notNull(),
  categoria: text('categoria').notNull(),
  metodoPago: text('metodo_pago').notNull(),
  monto: integer('monto').notNull(),
  fecha: text('fecha').notNull(),
  proveedorId: integer('proveedor_id').references(() => proveedores.id),
  createdAt: timestamp('created_at').defaultNow(),
});
