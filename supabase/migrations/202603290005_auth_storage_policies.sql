create extension if not exists pgcrypto;

create or replace function public.orry_current_user()
returns public."User"
language sql
stable
security definer
set search_path = public
as $$
  select u.*
  from public."User" u
  where u."authUserId" = auth.uid()::text
  limit 1
$$;

create or replace function public.orry_is_approved_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."User" u
    where u."authUserId" = auth.uid()::text
      and u.active = true
      and u."approvalStatus" = 'APPROVED'
  )
$$;

create or replace function public.orry_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."User" u
    join public."Role" r on r.id = u."roleId"
    where u."authUserId" = auth.uid()::text
      and u.active = true
      and u."approvalStatus" = 'APPROVED'
      and r.code::text = required_role
  )
$$;

alter table public."Role" enable row level security;
alter table public."User" enable row level security;
alter table public."PasswordResetToken" enable row level security;
alter table public."CompanyProfile" enable row level security;
alter table public."BankAccount" enable row level security;
alter table public."Contact" enable row level security;
alter table public."Warehouse" enable row level security;
alter table public."Product" enable row level security;
alter table public."InventoryBalance" enable row level security;
alter table public."DocumentCounter" enable row level security;
alter table public."DocumentLine" enable row level security;
alter table public."DocumentReference" enable row level security;
alter table public."DocumentActivity" enable row level security;
alter table public."SecurityEvent" enable row level security;

drop policy if exists "orry_role_read_approved" on public."Role";
DO $orry$
BEGIN
  CREATE POLICY "orry_role_read_approved" on public."Role"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_user_self_or_admin_read" on public."User";
DO $orry$
BEGIN
  CREATE POLICY "orry_user_self_or_admin_read" on public."User"
for select
using (
  "authUserId" = auth.uid()::text
  or public.orry_has_role('ADMIN')
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_user_admin_write" on public."User";
DO $orry$
BEGIN
  CREATE POLICY "orry_user_admin_write" on public."User"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_company_profile_read_approved" on public."CompanyProfile";
DO $orry$
BEGIN
  CREATE POLICY "orry_company_profile_read_approved" on public."CompanyProfile"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_company_profile_admin_write" on public."CompanyProfile";
DO $orry$
BEGIN
  CREATE POLICY "orry_company_profile_admin_write" on public."CompanyProfile"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_bank_account_read_approved" on public."BankAccount";
DO $orry$
BEGIN
  CREATE POLICY "orry_bank_account_read_approved" on public."BankAccount"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_bank_account_admin_write" on public."BankAccount";
DO $orry$
BEGIN
  CREATE POLICY "orry_bank_account_admin_write" on public."BankAccount"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_contact_read_approved" on public."Contact";
DO $orry$
BEGIN
  CREATE POLICY "orry_contact_read_approved" on public."Contact"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_contact_mutate_approved" on public."Contact";
DO $orry$
BEGIN
  CREATE POLICY "orry_contact_mutate_approved" on public."Contact"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_warehouse_read_approved" on public."Warehouse";
DO $orry$
BEGIN
  CREATE POLICY "orry_warehouse_read_approved" on public."Warehouse"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_warehouse_admin_write" on public."Warehouse";
DO $orry$
BEGIN
  CREATE POLICY "orry_warehouse_admin_write" on public."Warehouse"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_product_read_approved" on public."Product";
DO $orry$
BEGIN
  CREATE POLICY "orry_product_read_approved" on public."Product"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_product_mutate_approved" on public."Product";
DO $orry$
BEGIN
  CREATE POLICY "orry_product_mutate_approved" on public."Product"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_inventory_read_approved" on public."InventoryBalance";
DO $orry$
BEGIN
  CREATE POLICY "orry_inventory_read_approved" on public."InventoryBalance"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_inventory_mutate_approved" on public."InventoryBalance";
DO $orry$
BEGIN
  CREATE POLICY "orry_inventory_mutate_approved" on public."InventoryBalance"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_counter_read_approved" on public."DocumentCounter";
DO $orry$
BEGIN
  CREATE POLICY "orry_counter_read_approved" on public."DocumentCounter"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_counter_admin_write" on public."DocumentCounter";
DO $orry$
BEGIN
  CREATE POLICY "orry_counter_admin_write" on public."DocumentCounter"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_document_read_approved" on public."BusinessDocument";
DO $orry$
BEGIN
  CREATE POLICY "orry_document_read_approved" on public."BusinessDocument"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_document_mutate_approved" on public."BusinessDocument";
DO $orry$
BEGIN
  CREATE POLICY "orry_document_mutate_approved" on public."BusinessDocument"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_document_line_read_approved" on public."DocumentLine";
DO $orry$
BEGIN
  CREATE POLICY "orry_document_line_read_approved" on public."DocumentLine"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_document_line_mutate_approved" on public."DocumentLine";
DO $orry$
BEGIN
  CREATE POLICY "orry_document_line_mutate_approved" on public."DocumentLine"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_payment_read_approved" on public."PaymentEntry";
DO $orry$
BEGIN
  CREATE POLICY "orry_payment_read_approved" on public."PaymentEntry"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_payment_mutate_approved" on public."PaymentEntry";
DO $orry$
BEGIN
  CREATE POLICY "orry_payment_mutate_approved" on public."PaymentEntry"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_attachment_read_approved" on public."DocumentAttachment";
DO $orry$
BEGIN
  CREATE POLICY "orry_attachment_read_approved" on public."DocumentAttachment"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_attachment_mutate_approved" on public."DocumentAttachment";
DO $orry$
BEGIN
  CREATE POLICY "orry_attachment_mutate_approved" on public."DocumentAttachment"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_reference_read_approved" on public."DocumentReference";
DO $orry$
BEGIN
  CREATE POLICY "orry_reference_read_approved" on public."DocumentReference"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_reference_mutate_approved" on public."DocumentReference";
DO $orry$
BEGIN
  CREATE POLICY "orry_reference_mutate_approved" on public."DocumentReference"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_activity_read_approved" on public."DocumentActivity";
DO $orry$
BEGIN
  CREATE POLICY "orry_activity_read_approved" on public."DocumentActivity"
for select
using (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_activity_mutate_approved" on public."DocumentActivity";
DO $orry$
BEGIN
  CREATE POLICY "orry_activity_mutate_approved" on public."DocumentActivity"
for all
using (public.orry_is_approved_user())
with check (public.orry_is_approved_user());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_security_event_admin_read" on public."SecurityEvent";
DO $orry$
BEGIN
  CREATE POLICY "orry_security_event_admin_read" on public."SecurityEvent"
for select
using (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_security_event_admin_write" on public."SecurityEvent";
DO $orry$
BEGIN
  CREATE POLICY "orry_security_event_admin_write" on public."SecurityEvent"
for all
using (public.orry_has_role('ADMIN'))
with check (public.orry_has_role('ADMIN'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

drop policy if exists "orry_password_reset_no_client_access" on public."PasswordResetToken";
DO $orry$
BEGIN
  CREATE POLICY "orry_password_reset_no_client_access" on public."PasswordResetToken"
for select
using (false);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'orry-documents',
  'orry-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "orry_documents_storage_read_approved" on storage.objects;
create policy "orry_documents_storage_read_approved"
on storage.objects
for select
using (
  bucket_id = 'orry-documents'
  and public.orry_is_approved_user()
);

drop policy if exists "orry_documents_storage_insert_approved" on storage.objects;
create policy "orry_documents_storage_insert_approved"
on storage.objects
for insert
with check (
  bucket_id = 'orry-documents'
  and public.orry_is_approved_user()
);

drop policy if exists "orry_documents_storage_update_approved" on storage.objects;
create policy "orry_documents_storage_update_approved"
on storage.objects
for update
using (
  bucket_id = 'orry-documents'
  and public.orry_is_approved_user()
)
with check (
  bucket_id = 'orry-documents'
  and public.orry_is_approved_user()
);

drop policy if exists "orry_documents_storage_delete_admin" on storage.objects;
create policy "orry_documents_storage_delete_admin"
on storage.objects
for delete
using (
  bucket_id = 'orry-documents'
  and public.orry_has_role('ADMIN')
);
