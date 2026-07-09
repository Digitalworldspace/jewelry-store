/* ============================================================
   Supabase connection config
   Only the PUBLIC keys belong here — this file is loaded in
   the browser and will be visible to anyone who views source,
   and it will be visible in your public GitHub repo.

   NEVER put SUPABASE_SECRET_KEY (the sb_secret_... key) in this
   file, anywhere in this project, or in GitHub. That key has
   full admin access to your database and storage. Row Level
   Security policies (set up in supabase-setup.sql) are what
   keep the public key safe to expose.
   ============================================================ */
window.SUPABASE_URL = "https://fdzcgnxmgyyaoxnrvxdg.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_65knhSU2PTVflAqXhF_X4g_aKVp9LdO";

window.supabaseClient = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

/* Change this to your own WhatsApp business number (with country
   code, no + or spaces) to receive product enquiries from the site. */
window.WHATSAPP_NUMBER = "916352925472";

/* Your Razorpay Key ID — this one is meant to be public (like a
   publishable key), safe to keep in this file and in GitHub.
   NEVER put your Razorpay Key SECRET anywhere in this project —
   it only ever belongs inside your Supabase Edge Function secrets.
   Starts with "rzp_test_" while testing, "rzp_live_" once you go live. */
window.RAZORPAY_KEY_ID = "rzp_live_Sa1tFsYEgmLi8S";
