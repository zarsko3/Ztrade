const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  try {
    // Create trades table
    console.log('Creating trades table...');
    const { error: tradesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trades (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
        CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
        CREATE INDEX IF NOT EXISTS idx_trades_exit_date ON trades(exit_date);
        CREATE INDEX IF NOT EXISTS idx_trades_is_short ON trades(is_short);
      `
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }

    console.log('🎉 Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase(); 