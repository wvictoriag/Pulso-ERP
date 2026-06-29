import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { clientes, finanzas, pedidos, productos, proveedores, users, kardex } from '../db/schema';
import { eq, desc, sql, sum, count, gte, and, like } from 'drizzle-orm';
import { ZodError } from 'zod';
import {
  clienteSchema,
  proveedorSchema,
  productoSchema,
  pedidoSchema,
  finanzaSchema,
  kardexSchema
} from '../lib/validation';

export const apiRouter = express.Router();

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);

// Helper para actualizar stock y kardex usando transacción
// Lanza error si el stock queda negativo
async function adjustStock(tx: any, productoId: number, cantidad: number, tipoMovimiento: 'Entrada' | 'Salida', motivo: string, usuario: string, pedidoId?: number) {
  const product = await tx.select().from(productos).where(eq(productos.id, productoId)).limit(1);
  if (!product[0]) return;

  if (product[0].esKit && product[0].componentesKit) {
    // Es un kit, ajustamos los componentes
    const componentes: any[] = typeof product[0].componentesKit === 'string'
      ? JSON.parse(product[0].componentesKit)
      : product[0].componentesKit;

    for (const comp of componentes) {
      const pId = comp.productoId;
      const cQty = comp.cantidad * cantidad;
      if (pId) {
        await adjustStock(tx, pId, cQty, tipoMovimiento, motivo, usuario, pedidoId);
      }
    }
  } else {
    // Producto normal — validar stock suficiente para salidas
    if (tipoMovimiento === 'Salida') {
      const newStock = product[0].stock - cantidad;
      if (newStock < 0) {
        throw new Error(`Stock insuficiente para "${product[0].nombre}". Stock actual: ${product[0].stock}, solicitado: ${cantidad}`);
      }
    }

    const mult = tipoMovimiento === 'Entrada' ? 1 : -1;
    await tx.update(productos).set({ stock: product[0].stock + (cantidad * mult) }).where(eq(productos.id, productoId));

    // Registrar en kardex
    await tx.insert(kardex).values({
      productoId,
      tipoMovimiento,
      motivo,
      cantidad,
      fecha: new Date(),
      usuario: usuario || 'Sistema',
      pedidoId
    });
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

apiRouter.post('/auth/sync', requireAuth, async (req: any, res) => {
  const user = req.user;
  if (!user) return res.status(401).send();
  try {
    await db.insert(users).values({ uid: user.uid, email: user.email || '' }).onConflictDoUpdate({ target: users.uid, set: { email: user.email || '' } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sync failed' });
  }
});

apiRouter.get('/tables', requireAuth, (req, res) => {
  res.json({ tables: ['Clientes', 'Proveedores', 'Productos', 'Pedidos', 'Finanzas', 'Kárdex'] });
});

const getTableTarget = (name: string) => {
  const raw = name.toLowerCase();
  if(raw.includes('cliente')) return clientes;
  if(raw.includes('proveedor')) return proveedores;
  if(raw.includes('producto') || raw.includes('inventario')) return productos;
  if(raw.includes('venta') || raw.includes('pedido')) return pedidos;
  if(raw.includes('finanza')) return finanzas;
  if(raw.includes('kardex') || raw.includes('kárdex')) return kardex;
  return null;
};

const getValidationSchema = (name: string) => {
  const raw = name.toLowerCase();
  if (raw.includes('cliente')) return clienteSchema;
  if (raw.includes('proveedor')) return proveedorSchema;
  if (raw.includes('producto') || raw.includes('inventario')) return productoSchema;
  if (raw.includes('venta') || raw.includes('pedido')) return pedidoSchema;
  if (raw.includes('finanza')) return finanzaSchema;
  if (raw.includes('kardex') || raw.includes('kárdex')) return kardexSchema;
  return null;
};


const toPascalCase = (str: string) => {
  const map: any = {
    tipoCliente: 'Tipo de Cliente',
    condicionPago: 'Condición de Pago',
    estadoPago: 'Estado de Pago',
    clienteId: 'Cliente',
    proveedorId: 'Proveedor',
    metodoPago: 'Método de Pago',
    descripcion: 'Descripción',
    categoria: 'Categoría',
    nombre: 'Nombre',
    precio: 'Precio',
    costo: 'Costo',
    stock: 'Stock',
    email: 'Email',
    telefono: 'Teléfono',
    moneda: 'Moneda',
    fecha: 'Fecha',
    canal: 'Canal de Venta',
    estado: 'Estado del Pedido',
    items: 'Líneas de Venta',
    total: 'Total',
    tipo: 'Tipo',
    monto: 'Monto',
    contactoNombre: 'Nombre de Contacto',
    contactoEmail: 'Email de Contacto',
    rut: 'RUT',
    giro: 'Giro',
    direccion: 'Dirección',
    ciudad: 'Ciudad',
    numeroOc: 'Número de OC',
    solicitanteNombre: 'Nombre de Solicitante',
    solicitanteEmail: 'Email de Solicitante',
    productoId: 'Producto',
    tipoMovimiento: 'Tipo de Movimiento',
    motivo: 'Motivo',
    cantidad: 'Cantidad',
    usuario: 'Usuario',
    pedidoId: 'Pedido Asociado',
    esKit: 'Es Kit',
    componentesKit: 'Componentes del Kit',
    subtotal: 'Subtotal',
    iva: 'IVA',
    stockMinimo: 'Stock Mínimo',
  };
  return map[str] || (str.charAt(0).toUpperCase() + str.slice(1));
};

const toClientFormat = (record: any) => {
  const fields: any = {};
  for (const key of Object.keys(record)) {
    if (key !== 'id' && key !== 'createdAt') {
      fields[toPascalCase(key)] = record[key];
    }
  }
  return { id: record.id.toString(), fields };
};

const fromClientFormat = (fields: any) => {
  const record: any = {};
  const reverseMap: any = {
    'Tipo de Cliente': 'tipoCliente',
    'Condición de Pago': 'condicionPago',
    'Estado de Pago': 'estadoPago',
    'Cliente': 'clienteId',
    'Proveedor': 'proveedorId',
    'Método de Pago': 'metodoPago',
    'Descripción': 'descripcion',
    'Categoría': 'categoria',
    'Teléfono': 'telefono',
    'Canal de Venta': 'canal',
    'Estado del Pedido': 'estado',
    'Líneas de Venta': 'items',
    'Nombre de Contacto': 'contactoNombre',
    'Email de Contacto': 'contactoEmail',
    'RUT': 'rut',
    'Giro': 'giro',
    'Dirección': 'direccion',
    'Ciudad': 'ciudad',
    'Número de OC': 'numeroOc',
    'Nombre de Solicitante': 'solicitanteNombre',
    'Email de Solicitante': 'solicitanteEmail',
    'Producto': 'productoId',
    'Tipo de Movimiento': 'tipoMovimiento',
    'Motivo': 'motivo',
    'Cantidad': 'cantidad',
    'Usuario': 'usuario',
    'Pedido Asociado': 'pedidoId',
    'Es Kit': 'esKit',
    'Componentes del Kit': 'componentesKit',
    'Subtotal': 'subtotal',
    'IVA': 'iva',
    'Stock Mínimo': 'stockMinimo',
  };
  for (const key of Object.keys(fields)) {
    let dKey = reverseMap[key] || (key.charAt(0).toLowerCase() + key.slice(1));
    let val = fields[key];
    if ((dKey.endsWith('Id')|| dKey.endsWith('precio') || dKey.endsWith('costo') || dKey.endsWith('stock') || dKey.endsWith('monto') || dKey.endsWith('total') || dKey === 'subtotal' || dKey === 'iva' || dKey === 'cantidad') && val !== undefined && val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) val = parsed;
    }

    // Parse boolean for esKit
    if (dKey === 'esKit') {
      val = val === 'true' || val === true || val === 'Sí' || val === 'Si';
    }

    record[dKey] = val;
  }
  return record;
};

// GET /api/table/:tableName?page=1&limit=50&search=term
apiRouter.get('/table/:tableName', requireAuth, async (req, res) => {
  const target = getTableTarget(req.params.tableName);
  if (!target) return res.status(404).json({ error: 'Not found' });

  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    // Obtener datos paginados
    const data = await db.select().from(target).orderBy(desc(target.id)).limit(limit).offset(offset);

    // Contar total para metadata de paginación
    const totalResult = await db.select({ count: count() }).from(target);
    const total = totalResult[0]?.count || 0;

    res.json({
      data: data.map(toClientFormat),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB Error' });
  }
});

apiRouter.post('/table/:tableName', requireAuth, async (req, res) => {
  const target = getTableTarget(req.params.tableName);
  if (!target) return res.status(404).json({ error: 'Not found' });

  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload: records must be an array' });
    }

    const schema = getValidationSchema(req.params.tableName);
    const parsedRows: any[] = [];

    // Validar todas las filas primero para fallar rápido antes de tocar la base de datos
    for (const r of records) {
      const row = fromClientFormat(r.fields);
      if (schema) {
        try {
          schema.parse(row);
        } catch (err) {
          if (err instanceof ZodError) {
            return res.status(400).json({
              error: 'Validation failed',
              details: err.issues.map(e => `${e.path.join('.')}: ${e.message}`)
            });
          }
          throw err;
        }
      }
      parsedRows.push(row);
    }

    const created = await db.transaction(async (tx) => {
      const results = [];
      for (const row of parsedRows) {
        const newRecord = await tx.insert(target).values(row).returning();

        if (req.params.tableName === 'Pedidos' || req.params.tableName === 'Ventas') {
           if (row.estado === '✅ Entregado' || row.estado === '✅ Confirmado') {
             const items = row.items || [];
             const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
             for (const item of parsedItems) {
               const pId = item.productoId || item.Producto?.[0] || item.Producto;
               const qty = item.cantidad || item.Cantidad;
               if (pId && qty) {
                 try {
                   await adjustStock(tx, parseInt(pId), qty, 'Salida', 'Venta', (req as any).user?.email, newRecord[0].id);
                 } catch (stockErr: any) {
                   throw new Error(`Error en pedido: ${stockErr.message}`);
                 }
               }
             }
           }
        }
        results.push(toClientFormat(newRecord[0]));
      }
      return results;
    });

    res.json({ data: created });
  } catch (e: any) {
    console.error(e);
    const status = e.message.includes('Stock insuficiente') ? 400 : 500;
    res.status(status).json({ error: e.message.includes('Stock insuficiente') ? e.message : 'DB Error', message: e.message });
  }
});

apiRouter.post('/parse-document', requireAuth, async (req, res) => {
  try {
    const { fileBase64, mimeType, tableName } = req.body;
    if (!fileBase64 || !mimeType || !tableName) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    let schemaProperties: any = {};
    switch (tableName) {
      case 'Clientes':
        schemaProperties = {
          Nombre: { type: 'STRING' },
          RUT: { type: 'STRING' },
          Giro: { type: 'STRING' },
          Dirección: { type: 'STRING' },
          Ciudad: { type: 'STRING' },
          'Nombre de Contacto': { type: 'STRING' },
          'Email de Contacto': { type: 'STRING' },
          Teléfono: { type: 'STRING' },
          Email: { type: 'STRING' }
        };
        break;
      case 'Pedidos':
        schemaProperties = {
          'Número de OC': { type: 'STRING' },
          'Cliente': { type: 'STRING' },
          'Nombre de Solicitante': { type: 'STRING' },
          'Email de Solicitante': { type: 'STRING' },
          Total: { type: 'NUMBER' }
        };
        break;
      case 'Proveedores':
        schemaProperties = {
          Nombre: { type: 'STRING' },
          RUT: { type: 'STRING' },
          Giro: { type: 'STRING' },
          Dirección: { type: 'STRING' },
          Ciudad: { type: 'STRING' },
          Teléfono: { type: 'STRING' },
          Email: { type: 'STRING' }
        };
        break;
      default:
        return res.status(400).json({ error: 'Unsupported table' });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { data: fileBase64, mimeType } },
        { text: `Extract information from this document for the ${tableName} entity. Ensure data matches the required schema perfectly. Return only valid fields.` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT' as any,
          properties: schemaProperties
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    const data = JSON.parse(jsonStr);
    res.json({ data });
  } catch (e: any) {
    console.error('Error parsing document:', e);
    res.status(500).json({ error: e.message });
  }
});

apiRouter.delete('/table/:tableName/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const target = getTableTarget(req.params.tableName);
  if (!target) return res.status(404).json({ error: 'Not found' });
  try {
    await db.delete(target).where(eq(target.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'DB Error' }); }
});

apiRouter.put('/table/:tableName/:id', requireAuth, async (req, res) => {
  const target = getTableTarget(req.params.tableName);
  if (!target) return res.status(404).json({ error: 'Not found' });

  try {
    const row = fromClientFormat(req.body.fields);

    // Validación Zod
    const schema = getValidationSchema(req.params.tableName);
    if (schema) {
      try {
        schema.parse(row);
      } catch (err) {
        if (err instanceof ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            details: err.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          });
        }
        throw err;
      }
    }

    const recordId = parseInt(req.params.id);
    if (isNaN(recordId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = await db.transaction(async (tx) => {
      let isNewlyEntregado = false;
      let isNewlyCancelled = false;
      let oldItems: any[] = [];

      if (req.params.tableName === 'Pedidos' || req.params.tableName === 'Ventas') {
        const oldRecord = await tx.select().from(target).where(eq(target.id, recordId)).limit(1);
        if (oldRecord[0]) {
          const oldState = (oldRecord[0] as any).estado;
          const newState = row.estado;
          if ((newState === '✅ Entregado' || newState === '✅ Confirmado') && (oldState !== '✅ Entregado' && oldState !== '✅ Confirmado')) isNewlyEntregado = true;
          if ((newState !== '✅ Entregado' && newState !== '✅ Confirmado') && (oldState === '✅ Entregado' || oldState === '✅ Confirmado')) isNewlyCancelled = true;

          const rawItems = row.items || (oldRecord[0] as any).items || [];
          oldItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
        }
      }

      const updated = await tx.update(target).set(row).where(eq(target.id, recordId)).returning();

      if (isNewlyEntregado) {
         for (const item of oldItems) {
           const pId = item.productoId || item.Producto?.[0] || item.Producto;
           const qty = item.cantidad || item.Cantidad;
           if (pId && qty) {
             try {
               await adjustStock(tx, parseInt(pId), qty, 'Salida', 'Venta', (req as any).user?.email, recordId);
             } catch (stockErr: any) {
               throw new Error(`Error al confirmar pedido: ${stockErr.message}`);
             }
           }
         }
      } else if (isNewlyCancelled) {
         for (const item of oldItems) {
           const pId = item.productoId || item.Producto?.[0] || item.Producto;
           const qty = item.cantidad || item.Cantidad;
           if (pId && qty) {
             await adjustStock(tx, parseInt(pId), qty, 'Entrada', 'Devolución', (req as any).user?.email, recordId);
           }
         }
      }
      return updated[0];
    });

    res.json({ data: toClientFormat(result) });
  } catch (e: any) {
    console.error(e);
    const status = e.message.includes('Stock insuficiente') ? 400 : 500;
    res.status(status).json({ error: e.message.includes('Stock insuficiente') ? e.message : 'DB Error', message: e.message });
  }
});

// GET /api/stats — optimizado con agregaciones SQL
apiRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Ventas de hoy con SQL COUNT y SUM
    const todayStats = await db
      .select({
        count: count(),
        total: sum(pedidos.total),
      })
      .from(pedidos)
      .where(gte(pedidos.fecha, today));

    const ventasHoyCount = todayStats[0]?.count || 0;
    const ventasHoyTotal = todayStats[0]?.total || 0;

    // Productos con stock bajo — usa el umbral configurable por producto (stockMinimo) o el global
    const allProducts = await db.select({
      id: productos.id,
      stock: productos.stock,
      stockMinimo: productos.stockMinimo,
    }).from(productos);

    const lowStockCount = allProducts.filter(p => p.stock <= p.stockMinimo).length;

    res.json({ ventasHoyTotal, ventasHoyCount, lowStockCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Stats error' });
  }
});

// GET /api/charts — optimizado con SQL en vez de full table scan
apiRouter.get('/charts', requireAuth, async (req, res) => {
  try {
    const allVentas = await db.select().from(pedidos);
    const allFinanzas = await db.select().from(finanzas);
    const allProductos = await db.select().from(productos);
    const allClientes = await db.select().from(clientes);

    // Flujo de Caja (Ingresos vs Gastos por Mes)
    const cashflowByMonth: Record<string, { Ingresos: number, Gastos: number }> = {};

    // Add sales as Ingresos in cashflow
    allVentas.forEach((v: any) => {
      if (v.fecha && (v.estado === '✅ Entregado' || v.estado === '✅ Confirmado')) {
        const dateStr = typeof v.fecha === 'string' ? v.fecha : v.fecha.toISOString().split('T')[0];
        const month = dateStr.substring(0, 7);
        if (!cashflowByMonth[month]) cashflowByMonth[month] = { Ingresos: 0, Gastos: 0 };
        cashflowByMonth[month].Ingresos += (v.total || 0);
      }
    });

    allFinanzas.forEach((f: any) => {
      if (f.fecha) {
        const dateStr = typeof f.fecha === 'string' ? f.fecha : f.fecha.toISOString().split('T')[0];
        const month = dateStr.substring(0, 7);
        if (!cashflowByMonth[month]) cashflowByMonth[month] = { Ingresos: 0, Gastos: 0 };
        if (f.tipo === 'Ingreso' || f.tipo?.toLowerCase().includes('ingreso')) {
          cashflowByMonth[month].Ingresos += (f.monto || 0);
        } else if (f.tipo === 'Gasto' || f.tipo?.toLowerCase().includes('gasto') || f.tipo?.toLowerCase().includes('egreso')) {
          cashflowByMonth[month].Gastos += (f.monto || 0);
        }
      }
    });

    const monthlyCashflow = Object.entries(cashflowByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, data]) => ({ name, ...data }));

    // Top Products
    const productSales: Record<string, number> = {};
    allVentas.forEach((v: any) => {
      if (v.items && v.estado === '✅ Entregado') {
        for (const item of v.items) {
           const pId = item.productoId || item.Producto?.[0] || item.Producto;
           const qty = item.cantidad || item.Cantidad || 0;
           if (pId) {
             productSales[pId] = (productSales[pId] || 0) + qty;
           }
        }
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([id, quantity]) => {
         const p = allProductos.find((prod: any) => prod.id.toString() === id.toString());
         return { name: p?.nombre || `Producto ${id}`, quantity };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Top Clients
    const clientSales: Record<string, number> = {};
    allVentas.forEach((v: any) => {
      if (v.clienteId && v.estado === '✅ Entregado') {
         clientSales[v.clienteId] = (clientSales[v.clienteId] || 0) + (v.total || 0);
      }
    });

    const topClients = Object.entries(clientSales)
      .map(([id, total]) => {
         const c = allClientes.find((cli: any) => cli.id.toString() === id.toString());
         return { name: c?.nombre || c?.contactoNombre || `Cliente ${id}`, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({
      monthlyCashflow,
      topProducts,
      topClients
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Charts error' });
  }
});
