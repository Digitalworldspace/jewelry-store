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
