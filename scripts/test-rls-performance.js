const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s';

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPerformance() {
  console.log('🚀 Testing Supabase RLS Performance Optimizations...\n');

  try {
    // 1. Check if policies are optimized (scalar subqueries)
    console.log('1. Checking policy optimization...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, qual, with_check')
      .eq('schemaname', 'public')
      .in('tablename', ['trades', 'performance', 'users', 'User']);

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Policy Analysis:');
      
      let optimizedCount = 0;
      let totalCount = 0;
      
      policies.forEach(policy => {
        totalCount++;
        const isOptimized = (policy.qual && policy.qual.includes('(SELECT auth.uid())')) ||
                           (policy.with_check && policy.with_check.includes('(SELECT auth.uid())'));
        
        if (isOptimized) {
          optimizedCount++;
          console.log(`   ✅ ${policy.tablename}.${policy.policyname}: OPTIMIZED`);
        } else {
          console.log(`   ⚠️  ${policy.tablename}.${policy.policyname}: Needs optimization`);
        }
      });
      
      console.log(`\n📊 Optimization Status: ${optimizedCount}/${totalCount} policies optimized`);
    }

    // 2. Check for multiple permissive policies
    console.log('\n2. Checking for multiple permissive policies...');
    const { data: permissivePolicies, error: permissiveError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, roles, cmd, permissive')
      .eq('schemaname', 'public')
      .eq('permissive', true)
      .in('tablename', ['trades', 'performance', 'users', 'User'])
      .order('tablename, roles, cmd');

    if (permissiveError) {
      console.error('❌ Error checking permissive policies:', permissiveError);
    } else {
      console.log('✅ Permissive Policy Analysis:');
      
      // Group by table, role, and command
      const policyGroups = {};
      permissivePolicies.forEach(policy => {
        const key = `${policy.tablename}-${policy.roles}-${policy.cmd}`;
        if (!policyGroups[key]) {
          policyGroups[key] = [];
        }
        policyGroups[key].push(policy);
      });
      
      let hasMultiplePolicies = false;
      Object.entries(policyGroups).forEach(([key, policies]) => {
        if (policies.length > 1) {
          hasMultiplePolicies = true;
          console.log(`   ⚠️  Multiple policies for ${key}: ${policies.length} policies`);
          policies.forEach(policy => {
            console.log(`      - ${policy.policyname}`);
          });
        }
      });
      
      if (!hasMultiplePolicies) {
        console.log('   ✅ No multiple permissive policies found');
      }
    }

    // 3. Test query performance (if we have data)
    console.log('\n3. Testing query performance...');
    
    // Test trades table
    const startTime = Date.now();
    const { data: tradesData, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .limit(10);
    const tradesTime = Date.now() - startTime;
    
    if (tradesError) {
      console.log('   ⚠️  Trades query failed (might be empty table)');
    } else {
      console.log(`   ✅ Trades query: ${tradesTime}ms for ${tradesData.length} rows`);
    }
    
    // Test performance table
    const perfStartTime = Date.now();
    const { data: perfData, error: perfError } = await supabaseAdmin
      .from('performance')
      .select('*')
      .limit(10);
    const perfTime = Date.now() - perfStartTime;
    
    if (perfError) {
      console.log('   ⚠️  Performance query failed (might be empty table)');
    } else {
      console.log(`   ✅ Performance query: ${perfTime}ms for ${perfData.length} rows`);
    }

    // 4. Security verification
    console.log('\n4. Verifying security is maintained...');
    
    // Test anonymous access (should still be blocked)
    const { data: anonTrades, error: anonTradesError } = await supabaseAnon
      .from('trades')
      .select('*')
      .limit(1);

    if (anonTradesError) {
      console.log('   ✅ Anonymous access to trades: BLOCKED (security maintained)');
    } else {
      console.log('   ❌ WARNING: Anonymous access to trades: ALLOWED (security issue!)');
    }

    // Test service role access (should work)
    const { data: adminTrades, error: adminTradesError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .limit(1);

    if (adminTradesError) {
      console.log('   ❌ Service role access to trades: FAILED');
    } else {
      console.log('   ✅ Service role access to trades: WORKING');
    }

    // 5. Summary
    console.log('\n📋 Performance Optimization Summary:');
    
    const optimizationStatus = optimizedCount === totalCount ? 'COMPLETE' : 'PARTIAL';
    const securityStatus = anonTradesError && !adminTradesError ? 'MAINTAINED' : 'ISSUES';
    
    console.log(`   🔧 Policy Optimization: ${optimizationStatus}`);
    console.log(`   🛡️  Security: ${securityStatus}`);
    console.log(`   ⚡ Query Performance: ${tradesTime < 100 && perfTime < 100 ? 'GOOD' : 'NEEDS MONITORING'}`);
    
    if (optimizationStatus === 'COMPLETE' && securityStatus === 'MAINTAINED') {
      console.log('\n🎉 All optimizations successful!');
      console.log('   - RLS policies are optimized for performance');
      console.log('   - Security is maintained');
      console.log('   - Ready for production use');
    } else {
      console.log('\n⚠️  Some issues detected:');
      if (optimizationStatus !== 'COMPLETE') {
        console.log('   - Some policies need optimization');
      }
      if (securityStatus !== 'MAINTAINED') {
        console.log('   - Security issues detected');
      }
    }

  } catch (error) {
    console.error('❌ Error during performance testing:', error);
  }
}

// Run the performance test
testRLSPerformance().then(() => {
  console.log('\n✅ Performance testing complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Performance testing failed:', error);
  process.exit(1);
}); 