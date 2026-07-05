-- ============================================================
-- Run this ONCE in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste all of this → Run)
-- Nothing here needs a terminal or command line.
-- ============================================================

-- 1. Products table -------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone (including anonymous website visitors) can READ products
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

-- Only signed-in admins can add / edit / delete products
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  using (auth.role() = 'authenticated');

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (auth.role() = 'authenticated');

-- 2. Storage bucket for product photos -------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- 3. Enable realtime on products (so the storefront updates live) ----
alter publication supabase_realtime add table public.products;
