import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl,
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "User updated successfully",
        user: updatedUser
      });
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl,
          isActive: true,
          role: 'user'
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "User created successfully",
        user: newUser
      });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
} 