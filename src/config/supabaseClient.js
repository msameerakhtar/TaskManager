import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zwqhrlbinmcurloplhvo.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cWhybGJpbm1jdXJsb3BsaHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODIzMjgsImV4cCI6MjA4NjM1ODMyOH0.mrw6QqWdXwshLr0d8YMSNDMx6n_mHVca7bDwn373qs0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)