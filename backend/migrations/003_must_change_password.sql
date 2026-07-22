-- ============================================================
-- Migration 003: must_change_password flag
--
-- Accounts created via the Admin panel get a temp password
-- (see routes/admin.js) instead of an emailed invite link, since
-- single-use links are unreliable over SMS/iMessage. This flag
-- forces a password change on first login so the temp password
-- doesn't stay valid indefinitely.
-- ============================================================

alter table user_profiles
  add column must_change_password boolean not null default false;
