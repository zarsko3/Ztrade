import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email?: string;
    name?: string;
    role: string;
  };
  token?: string;
  message?: string;
}

export class AuthService {
  // Hash password
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password with hash
  private static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  private static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Register new user
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists'
        };
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: data.email }
        });

        if (existingEmail) {
          return {
            success: false,
            message: 'Email already exists'
          };
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email,
          name: data.name,
        }
      });

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || undefined,
          name: user.name || undefined,
          role: user.role,
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username: credentials.username }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      const isValidPassword = await this.comparePassword(credentials.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || undefined,
          name: user.name || undefined,
          role: user.role,
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { username }
      });
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Create default users
  static async createDefaultUsers(): Promise<void> {
    const defaultUsers = [
      {
        username: 'zarsko',
        password: 'passwords-089430732z',
        name: 'Zarsko',
        email: 'zarsko@example.com'
      },
      {
        username: 'ido',
        password: 'passwords-208090',
        name: 'Ido',
        email: 'ido@example.com'
      },
      {
        username: 'dor',
        password: 'passwords-308090',
        name: 'Dor',
        email: 'dor@example.com'
      },
      {
        username: 'daytrader',
        password: '405060',
        name: 'Day Trader',
        email: 'daytrader@example.com'
      }
    ];

    for (const userData of defaultUsers) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { username: userData.username }
        });

        if (!existingUser) {
          const hashedPassword = await this.hashPassword(userData.password);
          await prisma.user.create({
            data: {
              username: userData.username,
              password: hashedPassword,
              name: userData.name,
              email: userData.email,
            }
          });
          console.log(`Created user: ${userData.username}`);
        } else {
          console.log(`User already exists: ${userData.username}`);
        }
      } catch (error) {
        console.error(`Error creating user ${userData.username}:`, error);
      }
    }
  }
} 