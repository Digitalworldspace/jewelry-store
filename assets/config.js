/* ============================================================
   Supabase connection config
   Only the PUBLIC keys belong here
   ============================================================ */
window.SUPABASE_URL = "https://fdzcgnxmgyyaoxnrvxdg.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_65knhSU2PTVflAqXhF_X4g_aKVp9LdO";

window.supabaseClient = supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

/* WhatsApp business number (with country code, no + or spaces) */
window.WHATSAPP_NUMBER = "916352925472";
