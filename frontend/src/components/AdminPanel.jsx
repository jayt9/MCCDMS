import { useEffect, useState } from "react";
import { listUsers, inviteUser, setUserRole, deactivateUser } from "../api";

const ROLES = ["admin", "mcc_staff", "mcp_staff"];
const ROLE_LABELS = { admin: "Admin", mcc_staff: "MCC Staff", mcp_staff: "MCP Staff" };

export default function AdminPanel({ notify }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(ROLES[1]);
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  function refresh() {
    listUsers().then(setUsers).catch((err) => notify(err.message, "error"));
  }

  useEffect(refresh, []);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;
    setLoading(true);
    try {
      const { user, tempPassword } = await inviteUser({ email: email.trim(), display_name: displayName.trim(), role });
      setUsers((prev) => [user, ...prev]);
      setLastCreated({ email: email.trim(), tempPassword });
      notify(`Account created for ${email.trim()}.`);
      setEmail("");
      setDisplayName("");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(id, newRole) {
    try {
      const { user } = await setUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      notify(`Role updated to ${ROLE_LABELS[newRole]}.`);
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function handleDeactivate(id) {
    try {
      const { user } = await deactivateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      notify("User deactivated.");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <>
      <form className="record-card" onSubmit={handleInvite}>
        <span className="record-tab staff">New user</span>
        <h3>Create a user</h3>

        <div className="field">
          <label htmlFor="a_email">Email</label>
          <input
            id="a_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="a_name">Display name</label>
            <input id="a_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="a_role">Role</label>
            <select id="a_role" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create user"}
        </button>
      </form>

      {lastCreated && (
        <div className="record-card invite-link-card">
          <span className="record-tab staff">Credentials</span>
          <h3>Send these to {lastCreated.email}</h3>
          <p className="hint">
            Share this email + temporary password directly (text, WhatsApp,
            in person) — they can sign in with it right away using the normal
            login screen. Not a link, so nothing can consume it before they
            use it.
          </p>
          <div className="field">
            <label>Email</label>
            <input readOnly value={lastCreated.email} onFocus={(e) => e.target.select()} />
          </div>
          <div className="field">
            <label>Temporary password</label>
            <input readOnly value={lastCreated.tempPassword} onFocus={(e) => e.target.select()} />
          </div>
          <button
            type="button"
            className="submit-btn"
            onClick={() => {
              navigator.clipboard.writeText(
                `Email: ${lastCreated.email}\nPassword: ${lastCreated.tempPassword}`
              );
              notify("Copied to clipboard.");
            }}
          >
            Copy email + password
          </button>
        </div>
      )}

      <div className="roster-list">
        <h4>Users</h4>
        {users.length === 0 ? (
          <p className="empty">No users yet.</p>
        ) : (
          users.map((u) => (
            <div className="roster-row admin-row" key={u.id}>
              <span className="name">
                {u.display_name}
                {!u.is_active && <span className="role-badge inactive">Deactivated</span>}
              </span>
              <div className="admin-row-actions">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={!u.is_active}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  className="signout"
                  onClick={() => handleDeactivate(u.id)}
                  disabled={!u.is_active}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
