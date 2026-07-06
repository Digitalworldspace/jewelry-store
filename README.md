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

## 4. Using it day to day

**Managing products**
- Open `admin.html` directly (it's no longer linked from the public storefront — bookmark it). Sign in with the admin account you created in step 1.4.
- Fill in name, price, category, description, and choose a JPEG/PNG photo.
  - **MRP / original price** is optional — fill it in only when there's a real discount; the storefront will automatically show a strikethrough price and "% off".
  - **Badge** (New / Bestseller / Sale / Limited Stock) is optional and yours to set honestly — it's shown as a ribbon on the product card.
- Click **Upload & publish live** — it appears on `index.html` immediately.
- To remove a piece, click **Remove** next to it in the admin panel's product list.

**Handling orders (Buy Now)**
- Every product card and quick-view has a **Buy Now** button. A customer fills in their name, phone, quantity, and address, and it's saved straight into your Supabase `orders` table — no payment gateway involved, this is a cash-on-delivery style order request.
- After placing an order, the customer gets a **"Confirm on WhatsApp"** button that opens a pre-filled message to your WhatsApp number, so you can confirm the order with them directly.
- In `admin.html`, switch to the **Orders** tab to see every order live (it updates in real time), with a WhatsApp shortcut to message that customer and a status dropdown (Pending → Confirmed → Shipped → Delivered, or Cancelled).
- The Orders tab badge shows how many orders are still **Pending**.

## Why "Admin" isn't in the storefront menu

The admin link was removed from the public header and footer so casual visitors don't stumble onto the login screen — `admin.html` still works exactly the same if you go to it directly (e.g. `yoursite.com/admin.html`), just bookmark it for yourself. This isn't real access control by itself — that's handled by Supabase Auth and the RLS policies in `supabase-setup.sql` — it just keeps the storefront focused on customers.

## Important: keep the trust messaging honest

The homepage includes a top banner, a trust bar, and a "Why shop with us" section mentioning things like free shipping, cash on delivery, and 7-day returns. **Edit these in `index.html` to match your actual policies** before you go live — search for the text in the `.announce`, `.trust-bar`, and `#why` sections. Don't leave claims that aren't true for your store; it's both a trust issue with customers and, depending on your region, can have legal implications for advertising. The same applies to the FAQ answers and hero stat badges (500+ / 4.9★) — replace the placeholders with your real numbers.

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
