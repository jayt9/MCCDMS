// ============================================================
// db/index.js
//
// Supabase client for server-side use.
// Uses the service-role key so it bypasses RLS — access
// control is enforced by the API middleware, not by RLS alone.
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Writes a record-level audit log entry.
 * Call this from every create and update handler.
 *
 * @param {string} userId    - req.user.id
 * @param {string} entity    - 'child' | 'guardian_family'
 * @param {string} entityId  - the record's UUID
 * @param {string} action    - 'create' | 'update'
 */
async function auditLog(userId, entity, entityId, action) {
  const { error } = await supabase
    .from('audit_log')
    .insert({ user_id: userId, entity, entity_id: entityId, action });

  if (error) {
    // Non-fatal: log to server console but don't fail the request
    console.error('[audit_log] Failed to write audit entry:', error.message);
  }
}

module.exports = { supabase, auditLog };