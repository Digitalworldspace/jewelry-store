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
   NEVER put your Razorpay Key SECRET anywhere in this project — this
   site never needs it at all, since checkout opens Razorpay directly
   from the browser with just this Key ID (no backend/Edge Function
   involved). Starts with "rzp_test_" while testing, "rzp_live_" once
   you go live. */
window.RAZORPAY_KEY_ID = "rzp_live_TC2ibFsu1A5oaF";

/* Flat shipping fee charged to the customer, in ₹. Shown clearly on
   every order (cart drawer + checkout) before payment — never hidden
   or added as a surprise at the last step. Set to 0 if you want to
   offer free shipping instead. */
window.SHIPPING_FEE = 49;

/* Orders at or above this subtotal (in ₹) get free shipping — this
   must match whatever your on-site copy promises (the announcement
   bar and trust bar currently say "Free shipping on orders above
   ₹999"). Set to a very large number to effectively disable this and
   always charge SHIPPING_FEE, or edit the on-site copy to match. */
window.FREE_SHIPPING_THRESHOLD = 999;
