import { createClient } from '@supabase/supabase-js';

// আপনার সুপাবেস ড্যাশবোর্ড থেকে পাওয়া তথ্যগুলো এখানে দিন
// মনে রাখবেন: অবশ্যই সিঙ্গেল কোটেশন (' ') এর ভেতরে রাখতে হবে
const supabaseUrl = 'https://zyqhrmvwwwmtpokywpci.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_fcaVFKAVV_PKWuDDUo9PEw_ppLGAiLf'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);