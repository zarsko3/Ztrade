import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up database...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} users`);
    } catch (error) {
      console.log('❌ User table does not exist, creating schema...');
      
      // Push the schema to create tables
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma db push', { stdio: 'pipe' });
        console.log('✅ Schema pushed successfully');
        userCount = await prisma.user.count();
      } catch (pushError) {
        console.error('❌ Schema push failed:', pushError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create database schema',
          details: pushError instanceof Error ? pushError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Check if zarsko user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'zarsko' }
    });
    
    if (existingUser) {
      console.log('✅ User zarsko already exists');
      
      // Test password
      const passwordValid = await bcrypt.compare('123456', existingUser.password);
      
      return NextResponse.json({
        success: true,
        message: 'User zarsko already exists',
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          isActive: existingUser.isActive,
          role: existingUser.role,
          passwordValid
        },
        database: {
          userCount,
          tableExists: true
        }
      });
    }
    
    // Create zarsko user
    console.log('🔧 Creating user zarsko...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);
    
    const newUser = await prisma.user.create({
      data: {
        username: 'zarsko',
        password: hashedPassword,
        email: 'zarsko@example.com',
        name: 'Zarsko User',
        isActive: true,
        role: 'user'
      }
    });
    
    console.log('✅ User zarsko created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isActive: newUser.isActive,
        role: newUser.role,
        passwordValid: true
      },
      database: {
        userCount: userCount + 1,
        tableExists: true
      }
    });
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 