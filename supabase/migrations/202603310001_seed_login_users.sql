do $$
declare
  admin_role_id text;
  executive_role_id text;
  operations_role_id text;
  admin_uid uuid := gen_random_uuid();
  approve_uid uuid := gen_random_uuid();
  staff_uid uuid := gen_random_uuid();
begin
  insert into public."Role" (id, code, name)
  values
    (gen_random_uuid()::text, 'ADMIN', 'Administrator'),
    (gen_random_uuid()::text, 'EXECUTIVE', 'Executive Approver'),
    (gen_random_uuid()::text, 'OPERATIONS', 'Operations Manager')
  on conflict (code) do update
  set name = excluded.name;

  select id into admin_role_id from public."Role" where code = 'ADMIN';
  select id into executive_role_id from public."Role" where code = 'EXECUTIVE';
  select id into operations_role_id from public."Role" where code = 'OPERATIONS';

  if admin_role_id is null or executive_role_id is null or operations_role_id is null then
    raise exception 'Required roles are missing. Seed roles before running user seed.';
  end if;

  select id into admin_uid from auth.users where email = 'admin01@orry.local';
  if admin_uid is null then
    admin_uid := gen_random_uuid();
    insert into auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      encrypted_password,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin01@orry.local',
      '{"provider":"email","providers":["email"]}',
      '{"name":"admin01","first_name":"admin01","last_name":"Admin"}',
      false,
      extensions.crypt('admin9999', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt('admin9999', extensions.gen_salt('bf')),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}',
        raw_user_meta_data = '{"name":"admin01","first_name":"admin01","last_name":"Admin"}',
        email_confirmed_at = now(),
        confirmation_sent_at = now(),
        updated_at = now()
    where id = admin_uid;
  end if;

  delete from auth.identities where user_id = admin_uid and provider = 'email';
  insert into auth.identities (
    id,
    provider_id,
    provider,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    admin_uid,
    admin_uid::text,
    'email',
    admin_uid,
    jsonb_build_object('sub', admin_uid::text, 'email', 'admin01@orry.local'),
    now(),
    now(),
    now()
  );

  insert into public."User" (
    id,
    "authUserId",
    email,
    "passwordHash",
    name,
    "firstName",
    "lastName",
    "employeeId",
    active,
    "approvalStatus",
    "approvedAt",
    "roleId",
    "createdAt",
    "updatedAt"
  ) values (
    gen_random_uuid()::text,
    admin_uid::text,
    'admin01@orry.local',
    null,
    'admin01',
    'admin01',
    'Admin',
    'ADM-101',
    true,
    'APPROVED',
    now(),
    admin_role_id,
    now(),
    now()
  )
  on conflict (email) do update
  set "authUserId" = excluded."authUserId",
      "passwordHash" = null,
      name = excluded.name,
      "firstName" = excluded."firstName",
      "lastName" = excluded."lastName",
      "employeeId" = excluded."employeeId",
      active = true,
      "approvalStatus" = 'APPROVED',
      "approvedAt" = now(),
      "rejectedAt" = null,
      "roleId" = excluded."roleId",
      "updatedAt" = now();

  select id into approve_uid from auth.users where email = 'approve01@orry.local';
  if approve_uid is null then
    approve_uid := gen_random_uuid();
    insert into auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      encrypted_password,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      approve_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'approve01@orry.local',
      '{"provider":"email","providers":["email"]}',
      '{"name":"approve01","first_name":"approve01","last_name":"Approver"}',
      false,
      extensions.crypt('approve8888', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt('approve8888', extensions.gen_salt('bf')),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}',
        raw_user_meta_data = '{"name":"approve01","first_name":"approve01","last_name":"Approver"}',
        email_confirmed_at = now(),
        confirmation_sent_at = now(),
        updated_at = now()
    where id = approve_uid;
  end if;

  delete from auth.identities where user_id = approve_uid and provider = 'email';
  insert into auth.identities (
    id,
    provider_id,
    provider,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    approve_uid,
    approve_uid::text,
    'email',
    approve_uid,
    jsonb_build_object('sub', approve_uid::text, 'email', 'approve01@orry.local'),
    now(),
    now(),
    now()
  );

  insert into public."User" (
    id,
    "authUserId",
    email,
    "passwordHash",
    name,
    "firstName",
    "lastName",
    "employeeId",
    active,
    "approvalStatus",
    "approvedAt",
    "roleId",
    "createdAt",
    "updatedAt"
  ) values (
    gen_random_uuid()::text,
    approve_uid::text,
    'approve01@orry.local',
    null,
    'approve01',
    'approve01',
    'Approver',
    'APR-101',
    true,
    'APPROVED',
    now(),
    executive_role_id,
    now(),
    now()
  )
  on conflict (email) do update
  set "authUserId" = excluded."authUserId",
      "passwordHash" = null,
      name = excluded.name,
      "firstName" = excluded."firstName",
      "lastName" = excluded."lastName",
      "employeeId" = excluded."employeeId",
      active = true,
      "approvalStatus" = 'APPROVED',
      "approvedAt" = now(),
      "rejectedAt" = null,
      "roleId" = excluded."roleId",
      "updatedAt" = now();

  select id into staff_uid from auth.users where email = 'staff01@orry.local';
  if staff_uid is null then
    staff_uid := gen_random_uuid();
    insert into auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      encrypted_password,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      staff_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'staff01@orry.local',
      '{"provider":"email","providers":["email"]}',
      '{"name":"staff01","first_name":"staff01","last_name":"Staff"}',
      false,
      extensions.crypt('staff6666', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt('staff6666', extensions.gen_salt('bf')),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}',
        raw_user_meta_data = '{"name":"staff01","first_name":"staff01","last_name":"Staff"}',
        email_confirmed_at = now(),
        confirmation_sent_at = now(),
        updated_at = now()
    where id = staff_uid;
  end if;

  delete from auth.identities where user_id = staff_uid and provider = 'email';
  insert into auth.identities (
    id,
    provider_id,
    provider,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    staff_uid,
    staff_uid::text,
    'email',
    staff_uid,
    jsonb_build_object('sub', staff_uid::text, 'email', 'staff01@orry.local'),
    now(),
    now(),
    now()
  );

  insert into public."User" (
    id,
    "authUserId",
    email,
    "passwordHash",
    name,
    "firstName",
    "lastName",
    "employeeId",
    active,
    "approvalStatus",
    "approvedAt",
    "roleId",
    "createdAt",
    "updatedAt"
  ) values (
    gen_random_uuid()::text,
    staff_uid::text,
    'staff01@orry.local',
    null,
    'staff01',
    'staff01',
    'Staff',
    'STF-101',
    true,
    'APPROVED',
    now(),
    operations_role_id,
    now(),
    now()
  )
  on conflict (email) do update
  set "authUserId" = excluded."authUserId",
      "passwordHash" = null,
      name = excluded.name,
      "firstName" = excluded."firstName",
      "lastName" = excluded."lastName",
      "employeeId" = excluded."employeeId",
      active = true,
      "approvalStatus" = 'APPROVED',
      "approvedAt" = now(),
      "rejectedAt" = null,
      "roleId" = excluded."roleId",
      "updatedAt" = now();
end
$$;
