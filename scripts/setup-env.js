const crypto = require('crypto');

console.log('🔧 Environment Variable Setup Helper\n');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('📋 Environment Variables for Production:\n');

console.log('1. JWT_SECRET (for authentication):');
console.log(`   ${jwtSecret}\n`);

console.log('2. DATABASE_URL (for Supabase PostgreSQL):');
console.log('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
console.log('   Example: postgresql://postgres:your_password@db.khfzxzkpdxxsxhbmntel.supabase.co:5432/postgres\n');

console.log('🔧 Setup Instructions:');
console.log('1. Go to Vercel Dashboard: https://vercel.com/dashboard');
console.log('2. Select your project (ztrade)');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add these variables:');
console.log('   - Name: JWT_SECRET');
console.log('   - Value: (use the generated value above)');
console.log('   - Environment: Production');
console.log('   - Name: DATABASE_URL');
console.log('   - Value: (your Supabase connection string)');
console.log('   - Environment: Production');
console.log('5. Click "Save"');
console.log('6. Redeploy your application\n');

console.log('🔍 To get your Supabase connection string:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings → Database');
console.log('4. Copy the "Connection string" (URI format)');
console.log('5. Replace [YOUR-PASSWORD] with your actual database password\n');

console.log('✅ After setting environment variables:');
console.log('1. Test: https://ztrade.vercel.app/api/auth/check-env-detailed');
console.log('2. Test: https://ztrade.vercel.app/api/auth/diagnose-db');
console.log('3. Try user registration on your live site\n');

console.log('⚠️  Important Notes:');
console.log('- Never commit JWT_SECRET to git');
console.log('- Use different JWT_SECRET for each environment');
console.log('- Keep your database password secure');
console.log('- The free Supabase tier auto-pauses databases after inactivity'); 