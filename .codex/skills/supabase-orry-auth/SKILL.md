---
name: supabase-orry-auth
description: Supabase-backed ORRY back-office auth and user-management guardrails. Use when working on ORRY registration, login, approval-gated access, forgot-password/reset flows, credential email delivery, Supabase Postgres env wiring, or admin user-management screens so server-side approval rules, generic recovery messaging, and minimal UI scope stay consistent.
---

# Supabase ORRY Auth

Use this skill for ORRY auth and user-management work in `D:/01-Main-Work/Boots/Agentic-AI/mission-control/orry`.

## Core Rules

- Preserve the existing ORRY layout, spacing, navigation, and dark luxury visual system.
- Keep auth changes narrow: prefer editing `src/app/(auth)/*`, `src/app/(protected)/users/*`, and `src/lib/*auth*` / `src/lib/user-management.ts` before widening scope.
- Enforce all approval, activity, and role checks server-side.
- Treat the ORRY `User` table as the current source of truth unless the repo is explicitly migrated to native Supabase Auth.
- Do not claim native Supabase Auth if the implementation only uses Supabase-hosted Postgres with custom sessions.
- Do not claim email works unless transport and runtime config are actually verified.

## Current ORRY Model

- Identity currently lives in Prisma `User`, not in Supabase Auth identities.
- Approval state lives in `User.approvalStatus` with `PENDING`, `APPROVED`, `REJECTED`.
- Reset flow currently uses `PasswordResetToken` plus ORRY-managed email delivery.
- Session gating happens in `src/auth.ts` and must reject inactive or non-approved users.
- Security/audit events are recorded in `SecurityEvent` through `src/lib/audit.ts`.

## Files To Check First

- `prisma/schema.prisma`
- `src/auth.ts`
- `src/lib/user-management.ts`
- `src/lib/email.ts`
- `src/lib/password-policy.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(protected)/users/page.tsx`
- `src/app/(protected)/users/actions.ts`

## Implementation Workflow

1. Confirm whether the requested change is ORRY-managed auth or a true migration to Supabase Auth.
2. Verify the `User` schema already contains the required profile and approval fields before adding anything new.
3. Keep register and admin-create flows aligned: same identity fields, same temporary-password generator, different approval default.
4. Keep forgot-password responses generic; do not reveal account existence.
5. Ensure reset completion still checks `active` and `approvalStatus === APPROVED`.
6. Add or update `SecurityEvent` entries for registration, approval decisions, password reset request/completion, and login failures.
7. Reuse existing auth page structure and CSS classes; avoid introducing a parallel auth design system.
8. Verify env dependencies before claiming delivery: `DATABASE_URL`, `AUTH_SECRET`, `APP_BASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.

## Acceptance Checks

- Registration creates a pending user with profile fields stored.
- Temporary password is exactly 8 chars and includes upper/lowercase.
- Unapproved, rejected, or inactive users cannot log in.
- ADMIN-only user creation is enforced in the server action.
- Forgot-password flow returns generic responses.
- Reset tokens expire and are single-use.
- Email failures do not expose credentials in logs or UI.
- Final reporting distinguishes code wiring from runtime verification.
