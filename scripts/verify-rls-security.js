const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s';

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRLSSecurity() {
  console.log('🔒 Verifying Supabase RLS Security Configuration...\n');

  try {
    // 1. Check RLS status on tables
    console.log('1. Checking RLS status on tables...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_schema', 'public')
      .in('table_name', ['trades', 'performance', 'users', 'User']);

    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('✅ RLS Status:');
      rlsStatus.forEach(table => {
        console.log(`   ${table.table_name}: ${table.row_security ? 'ENABLED' : 'DISABLED'}`);
      });
    }

    // 2. Check existing policies
    console.log('\n2. Checking existing RLS policies...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, cmd, roles')
      .eq('schemaname', 'public')
      .order('tablename, policyname');

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Existing Policies:');
      if (policies.length === 0) {
        console.log('   No policies found - this is the security issue!');
      } else {
        policies.forEach(policy => {
          console.log(`   ${policy.tablename}.${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
        });
      }
    }

    // 3. Test anonymous access (should be blocked)
    console.log('\n3. Testing anonymous access (should be blocked)...');
    
    // Test trades table
    const { data: anonTrades, error: anonTradesError } = await supabaseAnon
      .from('trades')
      .select('*')
      .limit(1);

    if (anonTradesError) {
      console.log('✅ Anonymous access to trades: BLOCKED (expected)');
    } else {
      console.log('❌ WARNING: Anonymous access to trades: ALLOWED (security issue!)');
    }

    // Test performance table
    const { data: anonPerformance, error: anonPerformanceError } = await supabaseAnon
      .from('performance')
      .select('*')
      .limit(1);

    if (anonPerformanceError) {
      console.log('✅ Anonymous access to performance: BLOCKED (expected)');
    } else {
      console.log('❌ WARNING: Anonymous access to performance: ALLOWED (security issue!)');
    }

    // 4. Test service role access (should work)
    console.log('\n4. Testing service role access (should work)...');
    
    const { data: adminTrades, error: adminTradesError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .limit(1);

    if (adminTradesError) {
      console.log('❌ Service role access to trades: FAILED');
      console.error('   Error:', adminTradesError);
    } else {
      console.log('✅ Service role access to trades: WORKING');
    }

    // 5. Test authenticated user access (should work with proper user_id)
    console.log('\n5. Testing authenticated user access...');
    
    // This would require a real user session, so we'll just note it
    console.log('   Note: Authenticated user access testing requires a real user session');
    console.log('   This should be tested manually with a logged-in user');

    // 6. Summary and recommendations
    console.log('\n📋 Security Summary:');
    
    const hasRLS = rlsStatus?.every(table => table.row_security);
    const hasPolicies = policies && policies.length > 0;
    
    if (hasRLS && hasPolicies) {
      console.log('✅ RLS is enabled and policies are configured');
    } else {
      console.log('❌ Security issues detected:');
      if (!hasRLS) {
        console.log('   - RLS is not enabled on all tables');
      }
      if (!hasPolicies) {
        console.log('   - No RLS policies are configured');
      }
      console.log('\n🔧 To fix these issues, run the fix-supabase-rls.sql script');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyRLSSecurity().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
}); 