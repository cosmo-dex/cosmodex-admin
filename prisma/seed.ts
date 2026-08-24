import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_SEEDS = [
  {
    username: 'SuperAdmin',
    email: 'admin@cosmodex.com',
    password: 'SuperAdmin@2026!',
    role: 'super_admin',
  },
  {
    username: 'LearningAdmin',
    email: 'learning@cosmodex.com',
    password: 'LearningAdmin@2026!',
    role: 'learning_admin',
  },
  {
    username: 'ArenaAdmin',
    email: 'arena@cosmodex.com',
    password: 'ArenaAdmin@2026!',
    role: 'arena_admin',
  },
];

async function main() {
  console.log('🌱 Starting CosmoDex Admin Database Seeding...');

  for (const admin of ADMIN_SEEDS) {
    const passwordHash = await hash(admin.password, 12);

    const user = await prisma.users.upsert({
      where: { email: admin.email },
      update: {
        role: admin.role,
        is_active: true,
        password_hash: passwordHash,
      },
      create: {
        username: admin.username,
        email: admin.email,
        password_hash: passwordHash,
        role: admin.role,
        auth_provider: 'email',
        is_active: true,
        xp_total: 0,
        level: 1,
        interests: [],
      },
    });

    console.log(`✅ Provisioned Admin: ${admin.email} (Role: ${admin.role}) [ID: ${user.id}]`);
  }

  console.log('🎉 Admin Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
