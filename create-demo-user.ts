/**
 * Create Demo User Script
 * Creates demo@aidaw.com user for Quick Demo Login
 */

import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes, pbkdf2 } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);
const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('Creating demo user...');

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
      console.log(`   ID: ${existingUser.id}`);
      return;
    }

    // Hash password using pbkdf2
    const salt = randomBytes(16).toString('hex');
    const hash = await pbkdf2Async(password, salt, 10000, 64, 'sha512');
    const passwordHash = `${salt}:${hash.toString('hex')}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        emailVerified: true,
        role: 'USER',
      }
    });

    console.log('✅ Demo user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${user.id}`);

  } catch (error) {
    console.error('❌ Failed to create demo user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
