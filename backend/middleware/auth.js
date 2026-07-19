// ============================================================
// middleware/auth.js
//
// Two middleware functions used on every protected route:
//
//   authMiddleware   — validates the JWT, loads the user's role,
//                      attaches req.user. Rejects if inactive.
//
//   requireRole(...) — factory that returns a middleware checking
//                      req.user.role against an allowed list.
//
// Usage:
//   router.get('/',   authMiddleware, requireRole('admin', 'mcc_staff', 'mcp_staff'), handler)
//   router.post('/',  authMiddleware, requireRole('admin', 'mcc_staff'), handler)
// ============================================================

const { supabase } = require('../db');

// ─── authMiddleware ──────────────────────────────────────────

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Verify the JWT with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // 2. Load role and active status from user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, display_name, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[authMiddleware] profile lookup failed for user', user.id, profileError);
    return res.status(403).json({
      error: 'No user profile found. Contact an admin to set up your account.'
    });
  }

  // 3. Reject deactivated accounts
  if (!profile.is_active) {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }

  // 4. Attach to request — available to all downstream handlers
  req.user = {
    id:          user.id,
    email:       user.email,
    role:        profile.role,        // 'admin' | 'mcc_staff' | 'mcp_staff'
    displayName: profile.display_name,
  };

  next();
}

// ─── requireRole ─────────────────────────────────────────────

/**
 * Returns middleware that only allows through users whose role
 * is in the provided list. Must be used after authMiddleware.
 *
 * @param  {...string} roles  - e.g. requireRole('admin', 'mcc_staff')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive: authMiddleware should always run first
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This action requires: ${roles.join(' or ')}.`
      });
    }

    next();
  };
}

// ─── Role constants ───────────────────────────────────────────
// Define role sets once here so routes stay readable and
// changes to permissions only need to happen in one place.

const ROLES = {
  // All three roles can read
  ALL:       ['admin', 'mcc_staff', 'mcp_staff'],
  // Only MCC staff and admin can write
  CAN_WRITE: ['admin', 'mcc_staff'],
  // Only admin
  ADMIN:     ['admin'],
};

module.exports = { authMiddleware, requireRole, ROLES };
