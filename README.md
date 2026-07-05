# Zaveri House — Imitation Jewellery Store

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

1. Go to [github.com](https://github.com) → **New repository** (e.g. `zaveri-house`). Keep it **Public** (required for free GitHub Pages).
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
3. GitHub gives you a live URL like `https://your-username.github.io/zaveri-house/` within a minute or two.
4. Your storefront is `.../index.html` (or just the root URL) and your admin panel is `.../admin.html`.

## 4. Using it day to day

- Open `admin.html`, sign in with the admin account you created in step 1.4.
- Fill in name, price, category, description, and choose a JPEG/PNG photo.
- Click **Upload & publish live** — the photo goes to Supabase Storage, the product row is saved, and it appears on `index.html` immediately (open it in another tab to watch it appear without refreshing).
- To remove a piece, click **Remove** next to it in the admin panel's product list.

## Security notes — please read

- `assets/config.js` contains your Supabase **URL** and **publishable/anon key** only. These are meant to be public — they're safe to commit to a public GitHub repo, because the SQL policies control exactly what an anonymous key is allowed to do (read products, nothing else).
- **Never** put your `SUPABASE_SECRET_KEY` (the `sb_secret_...` value) into any file in this project or into GitHub. That key bypasses all security rules. It isn't used anywhere in this project — everything runs through the restricted anon key plus Supabase Auth.
- Because that secret key was pasted into this chat, it's good practice to rotate it: Supabase Dashboard → **Project Settings → API** → regenerate the secret key. You don't need to update anything in this project when you do — it's simply not used here.
- Keep your admin password private; anyone with it can add/remove products through `admin.html`.

## Customising

- Store name: edit the `<a class="brand">` text in `index.html` and `admin.html`.
- WhatsApp enquiry number: edit `WHATSAPP_NUMBER` in `assets/config.js`.
- Colours/fonts: edit the `:root` variables at the top of `assets/style.css`.
