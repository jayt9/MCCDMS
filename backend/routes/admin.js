// ============================================================
// routes/admin.js
//
// All routes here are admin-only. The requireRole('admin')
// check is applied at the router level in routes/index.js,
// so individual handlers don't need to repeat it.
//
// GET  /admin/users           — list all users + roles
// POST /admin/users           — invite a new user (creates auth + profile)
// PUT  /admin/users/:id/role  — change a user's role
// PUT  /admin/users/:id/deactivate — deactivate an account
// ============================================================

const express = require('express');
const { supabase } = require('../db');

const router = express.Router();

// ─── GET /admin/users ────────────────────────────────────────

router.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, role, is_active, created_at')
    .order('display_name');

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ─── POST /admin/users ───────────────────────────────────────
// Creates a Supabase auth user with a temporary password and a
// user_profile row with the assigned role.
//
// Deliberately not using invite/magic links here: they're
// single-use, and link-preview rendering in SMS/iMessage can
// silently consume the token before the recipient ever taps it
// (iOS renders previews in an on-device webview that executes
// the page's JS). A temp password is plain text — nothing can
// "click" it early — so it's delivered out-of-band by the admin
// and used with the normal sign-in form.

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

router.post('/users', async (req, res) => {
  const { email, display_name, role } = req.body;

  const VALID_ROLES = ['admin', 'mcc_staff', 'mcp_staff'];

  if (!email || !display_name || !role) {
    return res.status(400).json({
      error: 'email, display_name, and role are all required'
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: `role must be one of: ${VALID_ROLES.join(', ')}`
    });
  }

  const tempPassword = generateTempPassword();

  // 1. Create the auth user with the temp password, pre-confirmed
  // so they can log in immediately without an email confirmation step.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: `Failed to create user: ${authError.message}` });
  }

  const newUserId = authData.user.id;

  // 2. Create their profile with assigned role
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id:                   newUserId,
      display_name,
      role,
      is_active:            true,
      must_change_password: true,
      created_by:           req.user.id,
    })
    .select()
    .single();

  if (profileError) {
    return res.status(500).json({ error: `User created but profile failed: ${profileError.message}` });
  }

  res.status(201).json({
    message: `User created for ${email}`,
    tempPassword,
    user: profile,
  });
});

// ─── PUT /admin/users/:id/role ───────────────────────────────

router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const VALID_ROLES = ['admin', 'mcc_staff', 'mcp_staff'];

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: `role must be one of: ${VALID_ROLES.join(', ')}`
    });
  }

  // Prevent admin from changing their own role (safety guard)
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'User not found' });

  res.json({ message: `Role updated to ${role}`, user: data });
});

// ─── PUT /admin/users/:id/deactivate ─────────────────────────

router.put('/users/:id/deactivate', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'User not found' });

  res.json({ message: 'User deactivated', user: data });
});

module.exports = router;
