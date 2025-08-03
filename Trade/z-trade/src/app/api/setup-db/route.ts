import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Setting up database and creating user...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists by trying to query it
    try {
      await prisma.user.findFirst();
      console.log('✅ User table exists');
    } catch (error) {
      console.log('❌ User table does not exist, creating schema...');
      // Push schema to database
      const { execSync } = require('child_process');
      execSync('npx prisma db push', { stdio: 'pipe' });
      console.log('✅ Schema pushed to database');
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'zarsko' }
    });

    if (existingUser) {
      console.log('✅ User zarsko already exists');
      return NextResponse.json({
        success: true,
        message: 'User zarsko already exists',
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email
        }
      });
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

    console.log('✅ User created successfully');

    return NextResponse.json({
      success: true,
      message: 'Database setup and user creation completed',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 