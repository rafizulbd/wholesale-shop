import { createClient } from '@supabase/supabase-js';

// সুপাবেস কানেকশন ইনফরমেশন
const supabaseUrl = 'https://zyqhrmvwwwmtpokywpci.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_fcaVFKAVV_PKWuDDUo9PEw_ppLGAiLf'; 

// ১. সাধারণ ক্লায়েন্ট (এটি দিয়েই এখন ইউজার এবং অ্যাডমিন উভয় কাজ চলবে)
// আমরা profiles টেবিল ব্যবহার করায় এটি এখন নিরাপদ
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ২. অ্যাডমিন ক্লায়েন্ট (এটি শুধুমাত্র সার্ভার-সাইড কাজের জন্য রাখা হলো)
// ব্রাউজারে এরর এড়াতে এটি সরাসরি ইনপুট দেওয়া থেকে বিরত থাকুন
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});