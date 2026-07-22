import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTgxNzIsImV4cCI6MjA2NTA5NDE3Mn0.Xj0_mC7wS-t40WvA-Ewz3s2sQ_m7jK6yR5sT3_Q4_5k';

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
