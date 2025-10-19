/**
 * Create Demo User for Quick Demo Login
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('🚀 Creating demo user for Quick Demo Login...\n');

  const email = 'demo@aidaw.com';
  const password = 'DemoPassword123!';
  const name = 'Demo User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ Demo user already exists!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${existingUser.id}\n`);
      console.log('You can now use Quick Demo Login! 🎉\n');
      return;
    }

    console.log('Creating new demo user...');

    // Hash password using bcrypt (same as backend - 12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: true,
        isActive: true,
      }
    });

    console.log('\n✅ Demo user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${user.id}\n`);
    console.log('🎉 Quick Demo Login is now ready to use!\n');

  } catch (error) {
    console.error('\n❌ Failed to create demo user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
