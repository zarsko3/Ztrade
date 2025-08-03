import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth-service';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking users in database...');
  
  try {
    // Check existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });
    
    console.log(`Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email || 'no email'}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    if (users.length === 0) {
      console.log('\nNo users found. Creating default users...');
      await AuthService.createDefaultUsers();
      
      // Check again after creation
      const newUsers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
      
      console.log(`\nCreated ${newUsers.length} default users:`);
      newUsers.forEach(user => {
        console.log(`- ${user.username} (${user.email || 'no email'}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 