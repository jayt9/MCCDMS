-- ============================================================
-- MCC Digital Data Management System
-- Migration 001: Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'mcc_staff', 'mcp_staff');
create type gender_type as enum ('male', 'female');

-- ============================================================
-- USER PROFILES
-- Extends Supabase auth.users with role and active status.
-- One profile per auth user. Role is the single source of truth
-- for access control — checked on every API request.
-- ============================================================

create table user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text        not null,
  role         user_role   not null,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid        references auth.users(id)
);

-- ============================================================
-- GUARDIAN FAMILIES
-- A family/household unit. Every child must belong to one.
-- MCC staff create and edit these; MCP staff read only.
-- ============================================================

create table guardian_families (
  id              uuid        primary key default uuid_generate_v4(),
  family_name     text        not null,            -- e.g. "Mwangi Family"
  primary_contact text,                            -- name of main guardian
  relationship    text,                            -- e.g. "Grandmother", "Uncle"
  village         text,
  contact_phone   text,
  notes           text,
  created_at      timestamptz not null default now(),
  created_by      uuid        references auth.users(id),
  updated_at      timestamptz not null default now(),
  updated_by      uuid        references auth.users(id)
);

-- ============================================================
-- CHILDREN
-- Orphans in the Makindu program. Every child must belong to
-- a guardian family. guardian_family_id is NOT NULL — enforced
-- at DB level. MCC staff create and edit; MCP staff read only.
-- ============================================================

create table children (
  id                  uuid        primary key default uuid_generate_v4(),
  guardian_family_id  uuid        not null references guardian_families(id),
  first_name          text        not null,
  last_name           text        not null,
  date_of_birth       date,
  gender              gender_type,
  mcc_id              text        unique,     -- MCC's own reference ID
  date_entered_program date,                  -- when MCC began supporting this child
  is_active           boolean     not null default true,  -- false = no longer in program
  notes               text,
  created_at          timestamptz not null default now(),
  created_by          uuid        references auth.users(id),
  updated_at          timestamptz not null default now(),
  updated_by          uuid        references auth.users(id)
);

-- ============================================================
-- AUDIT LOG
-- Record-level: who touched which record, and when.
-- Written explicitly in API handlers (not via triggers)
-- so the logic is visible and debuggable.
-- ============================================================

create table audit_log (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id),
  entity     text        not null,   -- 'child' | 'guardian_family'
  entity_id  uuid        not null,
  action     text        not null,   -- 'create' | 'update'
  changed_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_children_family    on children(guardian_family_id);
create index idx_children_active    on children(is_active);
create index idx_audit_entity       on audit_log(entity, entity_id);
create index idx_audit_user         on audit_log(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- RLS is a safety net. Primary enforcement is in API middleware.
-- All authenticated users can read. Write is blocked at DB level
-- for mcp_staff as a backup — API middleware catches it first.
-- ============================================================

alter table user_profiles    enable row level security;
alter table guardian_families enable row level security;
alter table children          enable row level security;
alter table audit_log         enable row level security;

-- All authenticated users can read all tables
create policy "auth users read user_profiles"
  on user_profiles for select
  using (auth.role() = 'authenticated');

create policy "auth users read guardian_families"
  on guardian_families for select
  using (auth.role() = 'authenticated');

create policy "auth users read children"
  on children for select
  using (auth.role() = 'authenticated');

create policy "auth users read audit_log"
  on audit_log for select
  using (auth.role() = 'authenticated');

-- Write policies use a helper that checks the user_profiles role.
-- This is the DB-level backup to the API middleware check.
create or replace function get_my_role()
returns text as $$
  select role::text from user_profiles where id = auth.uid();
$$ language sql security definer stable;

create policy "admin and mcc_staff write guardian_families"
  on guardian_families for all
  using (get_my_role() in ('admin', 'mcc_staff'));

create policy "admin and mcc_staff write children"
  on children for all
  using (get_my_role() in ('admin', 'mcc_staff'));

create policy "admin writes user_profiles"
  on user_profiles for all
  using (get_my_role() = 'admin');

-- ============================================================
-- SEED: first admin user placeholder
-- Run this manually after creating the user in Supabase Auth:
--   insert into user_profiles (id, display_name, role)
--   values ('<auth-user-uuid>', 'Admin', 'admin');
-- ============================================================
