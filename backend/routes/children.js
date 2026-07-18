// ============================================================
// routes/children.js
//
// GET  /children        — list with search + filter (all roles)
// GET  /children/:id    — single child + family (all roles)
// POST /children        — create (admin + mcc_staff)
// PUT  /children/:id    — update (admin + mcc_staff)
//
// Every child MUST have a guardian_family_id.
// Validated at the API layer before hitting the DB.
// ============================================================

const express = require('express');
const { requireRole, ROLES } = require('../middleware/auth');
const { supabase, auditLog } = require('../db');

const router = express.Router();

// ─── GET /children ───────────────────────────────────────────

router.get('/', requireRole(...ROLES.ALL), async (req, res) => {
  const { search, village, active } = req.query;

  let query = supabase
    .from('children')
    .select(`
      id,
      first_name,
      last_name,
      mcc_id,
      gender,
      date_of_birth,
      date_entered_program,
      is_active,
      guardian_families ( id, family_name, village )
    `)
    .order('last_name');

  // Search by name or MCC ID
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,mcc_id.ilike.%${search}%`
    );
  }

  // Filter by active status — defaults to active children only.
  // Pass ?active=false to see inactive children, ?active=all for everyone.
  if (active === 'all') {
    // no filter — return everyone
  } else if (active === 'false') {
    query = query.eq('is_active', false);
  } else {
    query = query.eq('is_active', true);
  }

  // Filter by village (via the joined family)
  // Supabase doesn't support filtering on joined tables directly,
  // so we do a two-step: fetch village-matched family IDs first.
  if (village) {
    const { data: families } = await supabase
      .from('guardian_families')
      .select('id')
      .ilike('village', `%${village}%`);

    const familyIds = (families || []).map(f => f.id);
    if (familyIds.length === 0) return res.json([]);
    query = query.in('guardian_family_id', familyIds);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ─── GET /children/:id ───────────────────────────────────────

router.get('/:id', requireRole(...ROLES.ALL), async (req, res) => {
  const { data: child, error } = await supabase
    .from('children')
    .select(`
      *,
      guardian_families (*)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Child not found' });

  // Fetch audit trail for this child
  const { data: audit } = await supabase
    .from('audit_log')
    .select('action, entity, changed_at, user_id')
    .eq('entity', 'child')
    .eq('entity_id', req.params.id)
    .order('changed_at', { ascending: false })
    .limit(20);

  res.json({ ...child, audit: audit || [] });
});

// ─── POST /children ──────────────────────────────────────────

router.post('/', requireRole(...ROLES.CAN_WRITE), async (req, res) => {
  const {
    guardian_family_id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    mcc_id,
    date_entered_program,
    notes,
  } = req.body;

  // Validate required fields
  const missing = [];
  if (!guardian_family_id) missing.push('guardian_family_id');
  if (!first_name)         missing.push('first_name');
  if (!last_name)          missing.push('last_name');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`
    });
  }

  // Verify the guardian family exists
  const { data: family, error: familyError } = await supabase
    .from('guardian_families')
    .select('id')
    .eq('id', guardian_family_id)
    .single();

  if (familyError || !family) {
    return res.status(400).json({
      error: 'guardian_family_id does not reference an existing family'
    });
  }

  const { data, error } = await supabase
    .from('children')
    .insert({
      guardian_family_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      mcc_id,
      date_entered_program,
      is_active: true,
      notes,
      created_by: req.user.id,
      updated_by: req.user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await auditLog(req.user.id, 'child', data.id, 'create');

  res.status(201).json(data);
});

// ─── PUT /children/:id ───────────────────────────────────────

router.put('/:id', requireRole(...ROLES.CAN_WRITE), async (req, res) => {
  const {
    guardian_family_id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    mcc_id,
    date_entered_program,
    is_active,
    notes,
  } = req.body;

  // If guardian_family_id is being changed, verify the new family exists
  if (guardian_family_id) {
    const { data: family, error: familyError } = await supabase
      .from('guardian_families')
      .select('id')
      .eq('id', guardian_family_id)
      .single();

    if (familyError || !family) {
      return res.status(400).json({
        error: 'guardian_family_id does not reference an existing family'
      });
    }
  }

  // Build update object — only include fields that were provided
  const updates = {
    updated_at: new Date().toISOString(),
    updated_by: req.user.id,
  };

  if (guardian_family_id   !== undefined) updates.guardian_family_id   = guardian_family_id;
  if (first_name           !== undefined) updates.first_name           = first_name;
  if (last_name            !== undefined) updates.last_name            = last_name;
  if (date_of_birth        !== undefined) updates.date_of_birth        = date_of_birth;
  if (gender               !== undefined) updates.gender               = gender;
  if (mcc_id               !== undefined) updates.mcc_id               = mcc_id;
  if (date_entered_program !== undefined) updates.date_entered_program = date_entered_program;
  if (is_active            !== undefined) updates.is_active            = is_active;
  if (notes                !== undefined) updates.notes                = notes;

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Child not found' });

  await auditLog(req.user.id, 'child', data.id, 'update');

  res.json(data);
});

module.exports = router;