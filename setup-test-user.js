#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestUser() {
  try {
    // Check if test user exists
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (user) {
      console.log('✅ Test user already exists:', user.id);
      return user.id;
    }

    // Create test user
    user = await prisma.user.create({
      data: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password_placeholder'
      }
    });

    console.log('✅ Test user created:', user.id);
    return user.id;
  } catch (error) {
    console.error('❌ Error setting up test user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();
