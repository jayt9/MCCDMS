-- ============================================================
-- Migration 002: Table grants
--
-- 001 enabled RLS and added policies, but never granted base
-- table privileges to authenticated/anon/service_role. Supabase's
-- dashboard does this automatically for tables created through
-- it; a raw SQL migration does not, which surfaced as
-- "permission denied for table user_profiles" (a GRANT failure,
-- not an RLS failure — RLS would instead just return zero rows).
--
-- service_role needs its own grant too: it bypasses RLS, but not
-- base table privileges — the backend's service-role client hit
-- the same "permission denied" error until this was added.
-- ============================================================

grant usage on schema public to authenticated, anon, service_role;

grant select on user_profiles, guardian_families, children, audit_log to authenticated;
grant insert, update on guardian_families, children, audit_log to authenticated;

grant all on user_profiles, guardian_families, children, audit_log to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
