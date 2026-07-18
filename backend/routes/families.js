// ============================================================
// routes/families.js
//
// GET  /families        — list all (all roles)
// GET  /families/:id    — single family + their children (all roles)
// POST /families        — create (admin + mcc_staff)
// PUT  /families/:id    — update (admin + mcc_staff)
//
// No DELETE — records are never destroyed, only deactivated
// via a child's enrollment_status.
// ============================================================

const express = require('express');
const { requireRole, ROLES } = require('../middleware/auth');
const { supabase, auditLog } = require('../db');

const router = express.Router();

// ─── GET /families ───────────────────────────────────────────

router.get('/', requireRole(...ROLES.ALL), async (req, res) => {
  const { village } = req.query;

  let query = supabase
    .from('guardian_families')
    .select(`
      id,
      family_name,
      primary_contact,
      relationship,
      village,
      contact_phone,
      created_at,
      children ( id, first_name, last_name, enrollment_status )
    `)
    .order('family_name');

  if (village) {
    query = query.ilike('village', `%${village}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ─── GET /families/:id ───────────────────────────────────────

router.get('/:id', requireRole(...ROLES.ALL), async (req, res) => {
  const { data, error } = await supabase
    .from('guardian_families')
    .select(`
      *,
      children (
        id, first_name, last_name, date_of_birth,
        gender, mcc_id, enrollment_status, enrollment_date
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Family not found' });

  res.json(data);
});

// ─── POST /families ──────────────────────────────────────────

router.post('/', requireRole(...ROLES.CAN_WRITE), async (req, res) => {
  const {
    family_name,
    primary_contact,
    relationship,
    village,
    contact_phone,
    notes,
  } = req.body;

  if (!family_name) {
    return res.status(400).json({ error: 'family_name is required' });
  }

  const { data, error } = await supabase
    .from('guardian_families')
    .insert({
      family_name,
      primary_contact,
      relationship,
      village,
      contact_phone,
      notes,
      created_by: req.user.id,
      updated_by: req.user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await auditLog(req.user.id, 'guardian_family', data.id, 'create');

  res.status(201).json(data);
});

// ─── PUT /families/:id ───────────────────────────────────────

router.put('/:id', requireRole(...ROLES.CAN_WRITE), async (req, res) => {
  const {
    family_name,
    primary_contact,
    relationship,
    village,
    contact_phone,
    notes,
  } = req.body;

  const { data, error } = await supabase
    .from('guardian_families')
    .update({
      family_name,
      primary_contact,
      relationship,
      village,
      contact_phone,
      notes,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id,
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Family not found' });

  await auditLog(req.user.id, 'guardian_family', data.id, 'update');

  res.json(data);
});

module.exports = router;
