import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test login request received');
    
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
    };

    console.log('✅ Environment check:', envCheck);

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not set');
      return NextResponse.json(
        { error: 'JWT_SECRET not configured' },
        { status: 500 }
      );
    }

    console.log('✅ JWT_SECRET is set');

    // Find user
    console.log('✅ Looking for user:', username);
    const user = await prisma.user.findUnique({
      where: { username: username }
    });

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('✅ User found:', { id: user.id, username: user.username, isActive: user.isActive });

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active');
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('✅ Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('✅ JWT token generated');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    console.log('✅ Last login updated');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Test login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 