CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"rut" text,
	"giro" text,
	"direccion" text,
	"ciudad" text,
	"contacto_nombre" text,
	"contacto_email" text,
	"tipo_cliente" text,
	"condicion_pago" text,
	"telefono" text,
	"email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finanzas" (
	"id" serial PRIMARY KEY NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" text NOT NULL,
	"categoria" text NOT NULL,
	"metodo_pago" text NOT NULL,
	"monto" integer NOT NULL,
	"fecha" date NOT NULL,
	"proveedor_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kardex" (
	"id" serial PRIMARY KEY NOT NULL,
	"producto_id" integer NOT NULL,
	"tipo_movimiento" text NOT NULL,
	"motivo" text NOT NULL,
	"cantidad" integer NOT NULL,
	"fecha" date NOT NULL,
	"usuario" text,
	"pedido_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero_oc" text,
	"cliente_id" integer,
	"solicitante_nombre" text,
	"solicitante_email" text,
	"estado" text DEFAULT '💬 Cotización',
	"canal" text DEFAULT 'Directo',
	"estado_pago" text DEFAULT '⏳ Pendiente',
	"fecha" date NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"iva" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"categoria" text,
	"precio" integer DEFAULT 0 NOT NULL,
	"costo" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_minimo" integer DEFAULT 10 NOT NULL,
	"es_kit" boolean DEFAULT false NOT NULL,
	"componentes_kit" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"rut" text,
	"giro" text,
	"direccion" text,
	"ciudad" text,
	"condicion_pago" text,
	"moneda" text,
	"telefono" text,
	"email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "finanzas" ADD CONSTRAINT "finanzas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;