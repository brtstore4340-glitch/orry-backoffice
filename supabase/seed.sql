insert into public."Role" (id, code, name)
values
  ('role_admin', 'ADMIN', 'Administrator'),
  ('role_sales', 'SALES', 'Sales Lead'),
  ('role_finance', 'FINANCE', 'Finance Controller'),
  ('role_operations', 'OPERATIONS', 'Operations Manager'),
  ('role_executive', 'EXECUTIVE', 'Executive Approver')
on conflict (code) do update
set name = excluded.name;

insert into public."DocumentCounter" (id, kind, prefix, "lastNumber", "updatedAt")
values
  ('counter_proposal', 'PROPOSAL', 'PRP', 0, now()),
  ('counter_sales_order', 'SALES_ORDER', 'SO', 0, now()),
  ('counter_billing_record', 'BILLING_RECORD', 'BIL', 0, now()),
  ('counter_receipt', 'RECEIPT', 'RCT', 0, now()),
  ('counter_purchase_order', 'PURCHASE_ORDER', 'PO', 0, now()),
  ('counter_expense', 'EXPENSE', 'EXP', 0, now())
on conflict (kind) do update
set prefix = excluded.prefix;

insert into public."CompanyProfile" (
  id,
  "displayName",
  "legalName",
  "legalNameEn",
  "taxId",
  "branchName",
  "branchCode",
  "vatRegistered",
  "defaultCurrency",
  phone,
  mobile,
  email,
  website,
  address,
  "zipCode",
  "createdAt",
  "updatedAt"
)
values (
  'company_orry',
  'ORRY',
  'ORRY Commerce Co., Ltd.',
  'ORRY Commerce Co., Ltd.',
  '0105558096348',
  'Head Office',
  '00000',
  true,
  'THB',
  '02-114-7788',
  '099-274-7799',
  'ops@orry.co',
  'https://orry.co',
  '88 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok',
  '10110',
  now(),
  now()
)
on conflict (id) do update
set
  "displayName" = excluded."displayName",
  "legalName" = excluded."legalName",
  "legalNameEn" = excluded."legalNameEn",
  "taxId" = excluded."taxId",
  "branchName" = excluded."branchName",
  "branchCode" = excluded."branchCode",
  phone = excluded.phone,
  mobile = excluded.mobile,
  email = excluded.email,
  website = excluded.website,
  address = excluded.address,
  "zipCode" = excluded."zipCode",
  "updatedAt" = now();

insert into public."BankAccount" (
  id,
  "companyProfileId",
  "bankName",
  "accountName",
  "accountNumber",
  branch,
  "isPrimary",
  "createdAt"
)
values (
  'bank_primary_bbl',
  'company_orry',
  'Bangkok Bank',
  'ORRY Commerce Co., Ltd.',
  '123-4-56789-0',
  'Thong Lo',
  true,
  now()
)
on conflict (id) do update
set
  "bankName" = excluded."bankName",
  "accountName" = excluded."accountName",
  "accountNumber" = excluded."accountNumber",
  branch = excluded.branch,
  "isPrimary" = excluded."isPrimary";
