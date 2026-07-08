# Style OF Life — Imitation Jewellery Store

A live-connected jewellery e-commerce site:
- **`index.html`** — the public storefront. Fetches products from Supabase and updates live the moment something is added in the admin panel (no page refresh needed).
- **`admin.html`** — password-protected admin panel. Upload a JPEG/PNG photo + product details, and it publishes to the storefront instantly.
- **Supabase** is the backend — database, image storage, and login, all hosted for you. No server to run, nothing to install.

Everything below is done in a browser. No command line, no local software.

---

## 1. Set up your Supabase project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and open your project (the one with URL `fdzcgnxmgyyaoxnrvxdg.supabase.co`).
2. In the left sidebar, open **SQL Editor** → **New query**.
3. Open the file `supabase-setup.sql` from this project, copy all of it, paste it into the query box, and click **Run**.
   - This creates the `products` table, a public `product-images` storage bucket, and the security rules that let visitors *view* products while only signed-in admins can *add/edit/delete* them.
4. Create your admin login: sidebar → **Authentication** → **Users** → **Add user**. Give it an email and password — this is what you'll use to log into `admin.html`. (Turn off "auto confirm" only if you also want email verification; for a personal admin account, auto-confirm is fine.)

That's your backend fully live. No further Supabase setup needed.

## 2. Put the files on GitHub (all via the website)

1. Go to [github.com](https://github.com) → **New repository** (e.g. `style-of-life`). Keep it **Public** (required for free GitHub Pages).
2. On the new repo page, click **uploading an existing file**.
3. Drag in all the files from this project, keeping the folder structure:
   - `index.html`
   - `admin.html`
   - `README.md`
   - `supabase-setup.sql`
   - `assets/style.css`
   - `assets/config.js`
   - `assets/app.js`
   - `assets/admin.js`
4. Click **Commit changes** — all done in the browser, no git commands.

## 3. Turn on GitHub Pages (makes it live on the internet)

1. In your repo, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
3. GitHub gives you a live URL like `https://your-username.github.io/style-of-life/` within a minute or two.
4. Your storefront is `.../index.html` (or just the root URL) and your admin panel is `.../admin.html`.

## 4. Accept real online payments with Razorpay

The "Buy Now" checkout now opens a real Razorpay payment window and only marks an order as **Paid** after the payment is verified — all done through browser-based steps, no command line.

### 4a. Get your Razorpay keys
1. Sign up at [razorpay.com](https://razorpay.com) (free to start).
2. In the Razorpay Dashboard, make sure you're in **Test Mode** (toggle top-right) while you're setting things up.
3. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key Id** (starts `rzp_test_...`) and **Key Secret** — you'll only see the secret once, so save it somewhere safe.

### 4b. Deploy the two Edge Functions (Supabase Dashboard only — no CLI)
Your project already has two function files ready to paste in: `supabase/functions/create-razorpay-order/index.ts` and `supabase/functions/verify-razorpay-payment/index.ts`.

1. In Supabase, open **Edge Functions** in the sidebar → **Deploy a new function** → **Via Editor**.
2. Name it exactly `create-razorpay-order`, delete the placeholder code, and paste in the contents of `supabase/functions/create-razorpay-order/index.ts`. Click **Deploy**.
3. Repeat for `verify-razorpay-payment` using that file's contents.

### 4c. Add your secrets
Still in **Edge Functions**, open the **Secrets** tab and add:
| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | your Razorpay Key Id |
| `RAZORPAY_KEY_SECRET` | your Razorpay Key Secret |
| `SUPABASE_URL` | `https://fdzcgnxmgyyaoxnrvxdg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your project's **secret** key (the `sb_secret_...` one — never the publishable one) |

These secrets are only ever readable by your Edge Functions on Supabase's servers — never by the browser.

### 4d. Re-run the SQL, then add your public key to the site
1. Re-run `supabase-setup.sql` in the SQL Editor — it now adds `payment_status`, `razorpay_order_id`, and `razorpay_payment_id` columns to `orders` (safe to re-run).
2. In `assets/config.js`, replace `window.RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXXXX"` with your real **Key Id** (the public one — this is safe to commit to GitHub, same as a Stripe publishable key).
3. Re-upload everything to GitHub, including the new `supabase/functions/` folder (good to keep in the repo even though it isn't served — it's your source of truth for the functions).

### 4e. Test it
Place a test order on your live site and use one of [Razorpay's test cards](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. card number `4111 1111 1111 1111`, any future expiry, any CVV) to simulate a real payment without spending money.

### 4f. Going live
Once you've tested everything, complete Razorpay's KYC/business verification, switch Razorpay to **Live Mode**, generate **Live** API keys, and update both the `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` Edge Function secrets and `window.RAZORPAY_KEY_ID` in `config.js` to the live values (`rzp_live_...`).

### What happens if payment isn't completed
If a customer closes the payment window, their card is declined, or something goes wrong, the order is still saved as `Pending` / `Unpaid` — the site shows a "Retry payment" button plus a WhatsApp fallback so you never lose the lead. Nothing is ever marked "Paid" unless the Edge Function's signature check genuinely passes.

## 5. Using it day to day

**Managing products**
- Open `admin.html` directly (it's no longer linked from the public storefront — bookmark it). Sign in with the admin account you created in step 1.4.
- The dashboard up top shows **live stats**: products live, total orders, pending orders, and revenue from Confirmed/Shipped/Delivered orders.
- Fill in name, price, category (existing categories autocomplete as you type), description, and choose a JPEG/PNG photo.
  - **MRP / original price** is optional — fill it in only when there's a real discount; the storefront will automatically show a strikethrough price and "% off".
  - **Badge** (New / Bestseller / Sale / Limited Stock) is optional and yours to set honestly — it's shown as a ribbon on the product card.
- Click **Upload & publish live** — it appears on `index.html` immediately.
- Use **Search your catalog** to quickly find a product in a long list.
- Click **Edit** on any product to load it back into the form — change anything, optionally swap the photo, and click **Save changes**. Click **Cancel edit** to go back to adding a new piece.
- Click **Remove** to delete a piece from the live store.
- Forgot your password? Enter your email in the sign-in form and tap **Forgot password?** — Supabase will email you a reset link. (One-time setup: in Supabase, go to **Authentication → URL Configuration** and make sure your GitHub Pages URL is added under "Redirect URLs," or the reset link won't be allowed to complete.)

**Handling orders (Buy Now)**
- Every product card and quick-view has a **Buy Now** button. A customer fills in their name, phone, quantity, and address, and it's saved straight into your Supabase `orders` table.
- After placing an order, the customer gets a **"Confirm on WhatsApp"** button that opens a pre-filled message to your WhatsApp number, so you can confirm the order (and share payment details) with them directly.
- In `admin.html`, switch to the **Orders** tab to see every order live (it updates in real time). Filter by status (Pending / Confirmed / Shipped / Delivered / Cancelled), search by customer name or phone, message them on WhatsApp with one click, and update status with the dropdown.
- Click **Shipping label** on any order to open a print-ready 4×6" label (ship-to address, phone, order ID, date only — no order contents or payment info shown, so it's safe to hand to a courier) — click **Print label** in that window to send it to your printer.
- Each order has its own **Status** and **Payment Status** (Paid/Unpaid) dropdowns — set Payment Status manually any time, independent of Razorpay (useful for UPI/cash payments taken outside the site).
- Add a private **internal note** under any order (visible only in the admin panel, never shown to the customer) — it saves automatically when you click away from the field.
- Filter orders by status, by payment status, and by date range (Today / This week / This month / All time) — combine all three plus the search box.
- Click **Delete** to permanently remove an order (e.g. spam or a duplicate test order). This can't be undone.
- Click **Export CSV** to download all currently-filtered orders as a spreadsheet, including the **Order ID**, **Payment Status**, and **Admin Notes** columns.

**Bulk-updating orders from Excel**
1. Click **Export CSV** to download your orders.
2. Open it in Excel/Google Sheets and edit the **Status** column and/or the **Payment Status** column (Status must exactly match: Pending, Confirmed, Shipped, Delivered, or Cancelled — Payment Status must be Paid or Unpaid). Leave the **Order ID** column untouched. You can fill in just one of the two columns, or both.
3. Save it (as .xlsx or .csv), then use the **Bulk update statuses via Excel/CSV** uploader in the Orders tab to upload it. Every row with a matching Order ID and at least one valid value gets updated in one go.

**Analytics**
The **Analytics** tab shows: revenue over time (from verified paid orders), a breakdown of orders by status, your top-selling products by units ordered, and at-a-glance cards (average paid order value, total items ordered, unique customers, paid order count). All computed live from your real `orders` data — nothing here is simulated.

## The layout, top to bottom

The storefront now opens with a **small header**, a compact one-line intro banner, and goes straight into **The Showroom** — your live products flying into their diamond formation — before the full scrollable catalog. This puts your actual inventory in front of visitors immediately instead of behind a large hero section.

## The Showroom

Right under the hero, "The Showroom" pulls your **most recently added product** into a large center spot and the next six into an orbiting diamond formation around it — all real, live data from your `products` table. The moment a visitor scrolls to it, the pieces fly in from off-screen and settle into place. Add a new product in the admin panel and it'll take its place in the showroom automatically (newest items show up first, since it uses the same "newest first" ordering as the rest of the site). If you have fewer than 7 products, the layout just uses however many you have.

## Why "Admin" isn't in the storefront menu

The admin link was removed from the public header and footer so casual visitors don't stumble onto the login screen — `admin.html` still works exactly the same if you go to it directly (e.g. `yoursite.com/admin.html`), just bookmark it for yourself. This isn't real access control by itself — that's handled by Supabase Auth and the RLS policies in `supabase-setup.sql` — it just keeps the storefront focused on customers.

## Important: keep the trust messaging honest

The homepage includes a top banner, a trust bar, and a "Why shop with us" section. These currently mention free shipping, WhatsApp-confirmed orders, handpicked quality, and gift-ready packaging — **make sure every claim is true for your store** before you go live (search `.announce`, `.trust-bar`, and `#why` in `index.html`). Don't leave claims that aren't accurate; it's both a trust issue with customers and, depending on your region, can have legal implications for advertising. The same applies to the FAQ answers and hero stat badges (500+ / 4.9★) — replace the placeholders with your real numbers and policies.

## A note on the orders table's security

Anyone visiting the site can *create* an order (that's required — customers aren't logged in when they check out), but nobody except your signed-in admin account can *read, edit, or delete* orders. This is enforced by the RLS policies in `supabase-setup.sql`, not by hiding the admin link. If you start getting spammy fake orders, consider adding a CAPTCHA or a phone-verification step — that would need a bit more setup than covered here.

## Security notes — please read

- `assets/config.js` contains your Supabase **URL** and **publishable/anon key** only. These are meant to be public — they're safe to commit to a public GitHub repo, because the SQL policies control exactly what an anonymous key is allowed to do (read products, nothing else).
- **Never** put your `SUPABASE_SECRET_KEY` (the `sb_secret_...` value) into any file in this project or into GitHub. That key bypasses all security rules. It isn't used anywhere in this project — everything runs through the restricted anon key plus Supabase Auth.
- Because that secret key was pasted into this chat, it's good practice to rotate it: Supabase Dashboard → **Project Settings → API** → regenerate the secret key. You don't need to update anything in this project when you do — it's simply not used here.
- Keep your admin password private; anyone with it can add/remove products through `admin.html`.

## Customising

- Store name: edit the `<a class="brand">` text in `index.html` and `admin.html`.
- WhatsApp enquiry number: edit `WHATSAPP_NUMBER` in `assets/config.js`.
- Colours/fonts: edit the `:root` variables at the top of `assets/style.css`.
