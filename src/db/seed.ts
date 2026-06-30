import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Script para crear el primer usuario admin.
 * Uso: npx tsx src/db/seed.ts <firebase-uid> <email>
 *
 * Ejemplo:
 *   npx tsx src/db/seed.ts abc123def456 tu@email.com
 *
 * El <firebase-uid> lo obtienes desde Firebase Console > Authentication > Users.
 */
async function seedAdmin() {
  const uid = process.argv[2];
  const email = process.argv[3];

  if (!uid || !email) {
    console.error('Uso: npx tsx src/db/seed.ts <firebase-uid> <email>');
    console.error('');
    console.error('Pasos para obtener el Firebase UID:');
    console.error('  1. Ve a Firebase Console > Authentication > Users');
    console.error('  2. Inicia sesión en la app al menos una vez');
    console.error('  3. Copia el UID del usuario que aparece en la lista');
    process.exit(1);
  }

  try {
    // Verificar si el usuario ya existe
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existing.length > 0) {
      // Actualizar a admin si no lo es
      if (existing[0].role !== 'admin') {
        await db.update(users).set({ role: 'admin' }).where(eq(users.uid, uid));
        console.log(`Usuario ${email} actualizado a rol ADMIN.`);
      } else {
        console.log(`Usuario ${email} ya es ADMIN. Nada que hacer.`);
      }
      return;
    }

    // Crear nuevo usuario admin
    await db.insert(users).values({
      uid,
      email,
      role: 'admin',
    });

    console.log(`Admin creado exitosamente:`);
    console.log(`  UID:   ${uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Rol:   admin`);
    console.log('');
    console.log('Ahora puedes iniciar sesión y tendrás acceso completo.');

    process.exit(0);
  } catch (error: any) {
    console.error('Error al crear admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
