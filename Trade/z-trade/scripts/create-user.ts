import { AuthService } from '../src/services/auth-service';

async function createUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run create-user <username> <password> [email] [name]');
    console.log('Example: npm run create-user admin password123 admin@example.com "Admin User"');
    process.exit(1);
  }

  const [username, password, email, name] = args;

  try {
    console.log('Creating user...');
    const result = await AuthService.register({
      username,
      password,
      email: email || undefined,
      name: name || undefined
    });

    if (result.success) {
      console.log('✅ User created successfully!');
      console.log(`Username: ${username}`);
      if (email) console.log(`Email: ${email}`);
      if (name) console.log(`Name: ${name}`);
    } else {
      console.error('❌ Failed to create user:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createUser(); 