import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database...');

    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE,
          email VARCHAR(255) UNIQUE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create trades table
    console.log('Creating trades table...');
    const { error: tradesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trades (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          ticker VARCHAR(10) NOT NULL,
          entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
          entry_price DECIMAL(10,2) NOT NULL,
          exit_date TIMESTAMP WITH TIME ZONE,
          exit_price DECIMAL(10,2),
          quantity DECIMAL(15,4) NOT NULL,
          fees DECIMAL(10,2) DEFAULT 0,
          notes TEXT,
          tags TEXT,
          is_short BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tradesError) {
      console.error('Error creating trades table:', tradesError);
    } else {
      console.log('✅ Trades table created successfully');
    }

    // Create performance table
    console.log('Creating performance table...');
    const { error: performanceError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS performance (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          period VARCHAR(20) NOT NULL,
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          total_trades INTEGER NOT NULL,
          winning_trades INTEGER NOT NULL,
          losing_trades INTEGER NOT NULL,
          profit_loss DECIMAL(15,2) NOT NULL,
          sp_return DECIMAL(5,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (performanceError) {
      console.error('Error creating performance table:', performanceError);
    } else {
      console.log('✅ Performance table created successfully');
    }

    // Create indexes
    console.log('Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);',
      'CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);',
      'CREATE INDEX IF NOT EXISTS idx_trades_exit_date ON trades(exit_date);',
      'CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_performance_period ON performance(period);'
    ];

    for (const indexSql of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (error) {
        console.error('Error creating index:', error);
      }
    }

    console.log('✅ Indexes created successfully');

    // Test the connection
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('trades')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection test failed:', error);
    } else {
      console.log('✅ Database connection test successful');
      console.log('Database setup completed successfully!');
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

// Run the setup
setupDatabase(); 