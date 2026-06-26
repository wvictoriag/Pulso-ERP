import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rut: z.string().nullable().optional(),
  giro: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  contactoNombre: z.string().nullable().optional(),
  contactoEmail: z.string().email('El correo de contacto no es válido').nullable().or(z.literal('')).optional(),
  tipoCliente: z.string().nullable().optional(),
  condicionPago: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email('El correo principal no es válido').nullable().or(z.literal('')).optional(),
});

export const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rut: z.string().nullable().optional(),
  giro: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  condicionPago: z.string().nullable().optional(),
  moneda: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email('El correo no es válido').nullable().or(z.literal('')).optional(),
});

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  precio: z.number().int().min(0, 'El precio debe ser mayor o igual a 0'),
  costo: z.number().int().min(0, 'El costo debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  esKit: z.boolean().default(false),
  componentesKit: z.union([
    z.string(),
    z.array(z.object({
      productoId: z.number().int().positive(),
      cantidad: z.number().int().positive()
    }))
  ]).nullable().optional(),
});

export const itemPedidoSchema = z.object({
  productoId: z.union([z.number(), z.string()]),
  cantidad: z.number().int().positive('La cantidad debe ser un número positivo'),
  precioUnitario: z.number().int().optional(),
  nombre: z.string().optional()
});

export const pedidoSchema = z.object({
  numeroOc: z.string().nullable().optional(),
  clienteId: z.number().int().nullable().optional(),
  solicitanteNombre: z.string().nullable().optional(),
  solicitanteEmail: z.string().email('El correo del solicitante no es válido').nullable().or(z.literal('')).optional(),
  estado: z.string().default('💬 Cotización'),
  canal: z.string().default('Directo'),
  estadoPago: z.string().default('⏳ Pendiente'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  items: z.union([
    z.string(),
    z.array(itemPedidoSchema)
  ]).default('[]'),
  subtotal: z.number().int().min(0).default(0),
  iva: z.number().int().min(0).default(0),
  total: z.number().int().min(0).default(0),
});

export const finanzaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  tipo: z.string().min(1, 'El tipo de movimiento es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  metodoPago: z.string().min(1, 'El método de pago es obligatorio'),
  monto: z.number().int().positive('El monto debe ser un valor positivo'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  proveedorId: z.number().int().nullable().optional(),
});

export const kardexSchema = z.object({
  productoId: z.number().int().positive(),
  tipoMovimiento: z.string().min(1),
  motivo: z.string().min(1),
  cantidad: z.number().int().positive(),
  fecha: z.string().min(1),
  usuario: z.string().nullable().optional(),
  pedidoId: z.number().int().nullable().optional(),
});
