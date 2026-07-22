// ============================================================
// routes/me.js
//
// Self-service actions any authenticated user can do on their
// own account — no role restriction beyond being logged in.
//
// PUT /me/password-changed — clears must_change_password after
// the user has set a real password to replace their temp one.
// ============================================================

const express = require('express');
const { supabase } = require('../db');

const router = express.Router();

router.put('/password-changed', async (req, res) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ must_change_password: false })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ user: data });
});

module.exports = router;
