const TAB_LABELS = {
  families: "Families",
  children: "Children",
  admin: "Admin",
};

const ROLE_LABELS = {
  admin: "Admin",
  mcc_staff: "MCC Staff",
  mcp_staff: "MCP Staff",
};

export default function Sidebar({ tabs, active, onChange, counts, profile, onSignOut }) {
  return (
    <nav className="drawer">
      <div className="drawer-brand">
        <p className="mark">MCCDMS</p>
        <h1>Roster</h1>
      </div>
      <div className="drawer-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`drawer-tab ${active === tab ? "active" : ""}`}
            onClick={() => onChange(tab)}
          >
            {TAB_LABELS[tab]}
            {counts[tab] !== undefined && (
              <span className="count">{String(counts[tab]).padStart(2, "0")}</span>
            )}
          </button>
        ))}
      </div>
      <div className="drawer-foot">
        <div>
          Signed in as <span className="who">{profile.display_name}</span>
          <br />
          <span className="role-badge">{ROLE_LABELS[profile.role] ?? profile.role}</span>
        </div>
        <button className="signout" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
