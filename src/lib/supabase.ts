import { createClient } from '@supabase/supabase-js';

// This is a stub for the Supabase client.
// To use real Supabase, provide these environment variables in a .env file:
// VITE_SUPABASE_URL=your-supabase-url
// VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'stub-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
Usage Example when transitioning away from mockData:

export async function fetchActiveRentals() {
  const { data, error } = await supabase
    .from('rentals')
    .select(`
      *,
      vehicle:vehicles(*),
      staff:users(*)
    `)
    .in('status', ['Draft', 'Check-Out Completed', 'Awaiting Return', 'Check-In Submitted', 'AI Review Ready', 'Manual Review Needed']);
  
  if (error) throw error;
  return data;
}
*/
