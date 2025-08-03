import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    let token: string | null = null;

    // First try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no token in header, try to get from cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        token = cookies['auth-token'];
      }
    }

    if (!token) {
      return null;
    }

    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    // Verify user still exists and is active
    const user = await AuthService.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return null;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    return authenticatedRequest;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authenticatedRequest = await authenticateRequest(request);
    
    if (!authenticatedRequest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(authenticatedRequest);
  };
}

export function requireRole(role: string, handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authenticatedRequest = await authenticateRequest(request);
    
    if (!authenticatedRequest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (authenticatedRequest.user!.role !== role && authenticatedRequest.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(authenticatedRequest);
  };
} 