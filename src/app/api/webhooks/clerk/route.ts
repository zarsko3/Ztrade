import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data;
    
    try {
      // Create user in our database
      await prisma.user.create({
        data: {
          id: id,
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          username: username,
          imageUrl: image_url,
          isActive: true,
          role: 'user'
        }
      });
      
      console.log(`User ${id} created in database`);
    } catch (error) {
      console.error('Error creating user in database:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data;
    
    try {
      // Update user in our database
      await prisma.user.update({
        where: { id },
        data: {
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          username: username,
          imageUrl: image_url,
          updatedAt: new Date()
        }
      });
      
      console.log(`User ${id} updated in database`);
    } catch (error) {
      console.error('Error updating user in database:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      // Delete user from our database (this will cascade delete their trades)
      await prisma.user.delete({
        where: { id }
      });
      
      console.log(`User ${id} deleted from database`);
    } catch (error) {
      console.error('Error deleting user from database:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
} 