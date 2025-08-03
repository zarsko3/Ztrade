import { NextResponse } from 'next/server';

export async function GET() {
  return Response.json({ message: 'Simple API test working' });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Simple POST test endpoint is working',
    timestamp: new Date().toISOString()
  });
} 