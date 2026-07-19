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

## 4. Accept real online payments with Razorpay (no Edge Functions)

The "Buy Now" checkout opens a real Razorpay payment window entirely from the browser — no Supabase Edge Functions, no backend server, nothing beyond your Razorpay Key Id. This is simpler to set up, but comes with two tradeoffs worth understanding:

- **The amount isn't locked server-side.** Because there's no backend creating a fixed-amount order first, a technically determined visitor could in theory alter the amount in their browser's dev tools before paying. For a small personal store this is a low-probability risk, but it's real — if you outgrow this, the fix is reintroducing a server-side order-creation step (ask if you want that built later).
- **Payments aren't auto-verified.** Instead of the system confirming "Paid" automatically, **you confirm each payment yourself**: the customer's Payment ID is shown to them and sent to you on WhatsApp, you check it against your Razorpay Dashboard, then flip that order's **Payment Status** to Paid in the admin panel. This is a completely normal way small stores run UPI/card payments.

### 4a. Get your Razorpay key
1. Sign up at [razorpay.com](https://razorpay.com) (free to start).
2. In the Razorpay Dashboard, go to **Settings → API Keys**.
3. Copy your **Key Id** — that's the only value this setup needs (starts `rzp_test_...` in Test Mode, `rzp_live_...` once you're live). You do **not** need the Key Secret anywhere in this project.

### 4b. Add it to the site
1. Re-run `supabase-setup.sql` in the SQL Editor — it adds `payment_status`, `razorpay_order_id`, and `razorpay_payment_id` columns to `orders` (safe to re-run).
2. In `assets/config.js`, replace `window.RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXXXX"` with your real **Key Id**. This is safe to commit to GitHub — it's a public identifier, the same way a Stripe publishable key is.
3. Re-upload `assets/config.js` (and `assets/app.js` if you haven't already) to GitHub.

### 4c. Test it
Place a test order on your live site using a **Test Mode** Key Id and one of [Razorpay's test cards](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. card number `4111 1111 1111 1111`, any future expiry, any CVV) — no real money moves.

### 4d. Going live
Complete Razorpay's KYC/business verification, switch to **Live Mode** in their dashboard, copy your **Live** Key Id, and update `window.RAZORPAY_KEY_ID` in `config.js` to it (`rzp_live_...`). That's the only change needed to go from test to live.

### Confirming a payment
1. After a customer pays, they see a **Payment ID** (e.g. `pay_ABC123...`) and can send it to you directly via a pre-filled WhatsApp message.
2. Open your **Razorpay Dashboard → Payments**, search for that Payment ID, and confirm the amount and status look right.
3. In `admin.html`, find that order and set its **Payment Status** dropdown to **Paid**.

### What happens if payment isn't completed
If a customer closes the payment window, their card is declined, or something goes wrong, the order is still saved as `Pending` / `Unpaid` — the site shows a **Retry payment** button plus a WhatsApp fallback so you never lose the lead.

### The `supabase/functions/` folder
This project still includes `create-razorpay-order` and `verify-razorpay-payment` as optional Edge Functions, but **nothing in the live site calls them anymore**. They're there in case you want to upgrade to the more secure, fully-verified flow later — just ask, and I can wire them back in along with the setup steps.

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
- Click **Remove image** on any product to clear just its photo (the listing stays live, price/name/etc. untouched) — handy when a photo needs replacing without recreating the whole product. Click **Edit** afterward to upload a new one.
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

**Bulk actions — orders**
Tick the checkbox on any order row (or **Select all shown** to grab everything currently visible under your filters), and a bulk action bar appears above the list:
- **Set status…** / **Set payment…** — apply a new status or payment status to every selected order at once
- **Print labels** — opens one window with a shipping label for every selected order, ready to print in one go
- **Export selected** — downloads just the selected orders as CSV
- **Delete** — permanently removes every selected order (with confirmation)
- **Clear** — deselects everything

**Bulk actions — products**
Same pattern in the Products tab: tick products (or **Select all shown**), then:
- **Set badge…** — apply New/Bestseller/Sale/Limited Stock (or clear the badge) across every selected product
- **Delete** — permanently removes every selected product, including their photos from storage

**Bulk-updating orders from Excel**
1. Click **Export CSV** to download your orders.
2. Open it in Excel/Google Sheets and edit the **Status** column and/or the **Payment Status** column (Status must exactly match: Pending, Confirmed, Shipped, Delivered, or Cancelled — Payment Status must be Paid or Unpaid). Leave the **Order ID** column untouched. You can fill in just one of the two columns, or both.
3. Save it (as .xlsx or .csv), then use the **Bulk update statuses via Excel/CSV** uploader in the Orders tab to upload it. Every row with a matching Order ID and at least one valid value gets updated in one go.

**Analytics**
The **Analytics** tab shows: revenue over time (from verified paid orders), a breakdown of orders by status, your top-selling products by units ordered, and at-a-glance cards (average paid order value, total items ordered, unique customers, paid order count). All computed live from your real `orders` data — nothing here is simulated.

## Order IDs, date grouping, and mobile polish

- Every order now shows a short **Order ID** tag (e.g. `#A1B2C3D4`) right on its row in the admin panel, and orders are grouped under **date headers** (Today / Yesterday / the full date) so it's easy to scan what came in when.
- Search in the Orders tab now matches name, phone, **or Order ID**.
- Customers see their own Order ID on the "Order saved" and "Payment successful" screens after checkout, and it's included in the WhatsApp messages sent both ways — so an Order ID is something you and the customer can both reference immediately.
- The "Phone number" field in checkout is now labelled **WhatsApp number**, since that's what it's actually used for. Your own store's WhatsApp number is now shown as visible, tappable text (not just a button) in the footer and above the "Chat with us" button — pulled automatically from `WHATSAPP_NUMBER` in `config.js`.
- Product cards in "The Collection" are now a strict uniform size regardless of name length or badges (long names truncate with an ellipsis rather than stretching the card).
- Did a full mobile pass on both `index.html` and `admin.html` — order rows, product rows, the bulk-action bar, filters, and stat cards all reflow into single-column, thumb-friendly layouts on small screens instead of staying in a cramped grid.

## The layout, top to bottom

The storefront now opens with a **small header**, a compact one-line intro banner, and goes straight into **The Showroom** — your live products flying into their diamond formation — before the full scrollable catalog. This puts your actual inventory in front of visitors immediately instead of behind a large hero section.

## The Showroom

Right under the hero, "The Showroom" pulls **7 random products** into a large center spot plus an orbiting diamond formation around it — a different, real, live selection each time someone loads the page (it stays stable while they're browsing, then reshuffles on their next visit). All real data from your `products` table — nothing here is simulated. If you have fewer than 7 products, it just uses however many you have.

Click any product anywhere on the site (Showroom or the main Collection) and its quick-view now shows a **"Goes well with this piece"** strip of related products — same category when possible, otherwise a random mix — click any of them to jump straight to that product.

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

## SEO checklist

The site now has real SEO groundwork built in — here's what's there and what you need to fill in before launch.

**What's already done:**
- Descriptive, keyword-rich `<title>` and meta description
- Open Graph and Twitter Card tags (so links look good when shared on WhatsApp, Facebook, X, etc.)
- `JewelryStore` structured data (JSON-LD) describing your business to Google
- **Live product structured data** — every time the catalog loads, `app.js` rebuilds a `Product` list in JSON-LD using your real live prices, names, and images, so Google can potentially show rich results (price, availability) for your actual catalog
- `robots.txt` (allows the storefront, blocks `admin.html` from being indexed)
- `sitemap.xml`
- `manifest.json` and a brand favicon (`assets/favicon.svg`)
- Clean heading structure (one `<h1>`, proper `<h2>`/`<h3>` nesting) and `alt` text on every product image

**What you need to fill in — search each file for "siteConfig" to find every spot:**
1. **Your real domain** — once GitHub Pages gives you a URL, update it in: `index.html` (canonical link, `og:url`, `og:image`, the JSON-LD `url`), `robots.txt` (Sitemap line), and `sitemap.xml` (`<loc>`).
2. **A real social preview image** — create a 1200×630px image (a nice product flat-lay or logo) and save it as `assets/og-image.jpg`, matching the path already referenced in the meta tags.
3. **Real business details** — in the `JewelryStore` structured data in `index.html`, replace the placeholder `telephone` with your real number, and add your social profile URLs to `sameAs` (e.g. Instagram, Facebook) if you have them.
4. **Submit to Google** — once live, submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) (add your property, verify ownership, then Sitemaps → add `sitemap.xml`).

**A limitation worth knowing:** your product catalog is loaded live from Supabase via JavaScript. Modern Googlebot generally executes JavaScript and can index this, but it's not instant or guaranteed the way a plain HTML page is — search engines may take longer to pick up new products, and some other crawlers (Bing, social-media link previews) may not run JavaScript at all and will only see the static content above the fold. This is a normal tradeoff for any live, database-backed storefront like this one.

## Team roles: Owner vs Staff

`admin.html` supports two roles:
- **Owner** — everything Staff can do, plus the **Activity Log** (every sign-in and action, filterable per person) and the **Team** tab (add/remove team members, assign roles).
- **Staff** — can manage Products and Orders (the day-to-day work), but the Activity Log and Team tabs are hidden, and the database itself blocks them from reading activity/customer-analytics data even if they tried directly — this isn't just a hidden button.

**One-time setup — make yourself the owner:**
1. Open `supabase-setup.sql`, find the line that says:
   ```sql
   insert into public.admin_users (email, role)
   values ('you@example.com', 'owner')
   ```
2. Replace `you@example.com` with the exact email of your existing admin login (the one from Supabase → Authentication → Users).
3. Run the full script in the SQL Editor (safe to re-run).
4. Sign into `admin.html` — you'll see "Owner" next to your name, and the Activity Log and Team tabs will appear.

**Adding a staff member:**
1. First create their login the normal way: Supabase → Authentication → Users → Add user.
2. Then, as the owner, go to the **Team** tab in `admin.html`, enter their email, leave the role as **Staff**, and save. They'll now be able to sign in and manage products/orders, but won't see Activity Log or Team.
3. To promote someone to Owner later, just re-save their email with the Owner role selected.

You can also set roles directly in Supabase if you prefer — either **Table Editor → admin_users** (insert/edit a row, `role` must be exactly `owner` or `staff`), or by running `set-admin-role.sql` in the SQL Editor. Both paths write to the same table, so the Team tab always reflects whichever way you made the change.

Anyone who signs in but isn't listed in `admin_users` yet is treated as **Staff** by default — a safe, least-privilege fallback rather than accidentally granting owner access.

**The Team tab now shows every login, not just ones already assigned a role** — it pulls the full list straight from Supabase Authentication (via a secure function only an Owner can call), showing "Staff" as the default for anyone not yet set. Click **Make Owner** / **Make Staff** right next to any name for a one-click change, or use the form above it the same way as before.

**Products are also scoped per person now:** Staff only see and can edit/delete the products *they personally added* — other team members' products don't show up in their catalog at all. The Owner always sees and can manage everyone's products. This is enforced by the database itself (not just hidden in the UI), so a staff account genuinely cannot modify someone else's product even by calling the API directly. The public storefront is unaffected — customers always see the full combined catalog from everyone.
