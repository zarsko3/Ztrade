import { AuthService } from '../src/services/auth-service';

async function setupUsers() {
  console.log('Setting up default users...');
  
  try {
    await AuthService.createDefaultUsers();
    console.log('Default users created successfully!');
    
    console.log('\nDefault user accounts:');
    console.log('Username: zarsko, Password: passwords-089430732z');
    console.log('Username: ido, Password: passwords-208090');
    console.log('Username: dor, Password: passwords-308090');
    console.log('Username: daytrader, Password: 405060');
    
  } catch (error) {
    console.error('Error setting up users:', error);
  }
}

setupUsers(); 