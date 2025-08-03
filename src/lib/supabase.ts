import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s'

// Create Supabase client for client-side operations (with anonymous key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase client for server-side operations (with service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database table names
export const TABLES = {
  TRADES: 'trades',
  PERFORMANCE: 'performance',
  USERS: 'users'
} as const

// Database types (matching our existing Trade interface)
export interface DatabaseTrade {
  id: string
  user_id: string
  ticker: string
  entry_date: string
  entry_price: number
  exit_date: string | null
  exit_price: number | null
  quantity: number
  fees: number
  notes: string | null
  tags: string | null
  is_short: boolean
  created_at: string
  updated_at: string
}

export interface DatabasePerformance {
  id: string
  period: string
  start_date: string
  end_date: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  profit_loss: number
  sp_return: number
  created_at: string
} 