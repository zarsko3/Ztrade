import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('🔍 Creating user: zarsko');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'zarsko' }
    });

    if (existingUser) {
      console.log('❌ User zarsko already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);
    
    console.log('✅ Password hashed successfully');

    // Create user
    const user = await prisma.user.create({
      data: {
        username: 'zarsko',
        password: hashedPassword,
        email: 'zarsko@example.com',
        name: 'Zarsko User',
        isActive: true,
        role: 'user'
      }
    });

    console.log('✅ User created successfully:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 