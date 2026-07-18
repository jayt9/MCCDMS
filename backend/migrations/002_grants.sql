-- ============================================================
-- Migration 002: Table grants
--
-- 001 enabled RLS and added policies, but never granted base
-- table privileges to the authenticated/anon roles. Supabase's
-- dashboard does this automatically for tables created through
-- it; a raw SQL migration does not, which surfaced as
-- "permission denied for table user_profiles" (a GRANT failure,
-- not an RLS failure — RLS would instead just return zero rows).
-- ============================================================

grant usage on schema public to authenticated, anon;

grant select on user_profiles, guardian_families, children, audit_log to authenticated;
grant insert, update on guardian_families, children, audit_log to authenticated;

grant usage, select on all sequences in schema public to authenticated;
