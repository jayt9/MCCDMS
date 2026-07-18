import { useState } from "react";
import { createChild } from "../api";
import RosterList from "./RosterList.jsx";

export default function ChildForm({ families, children, canWrite, onCreated, notify }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [mccId, setMccId] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !familyId) return;
    setLoading(true);
    try {
      const child = await createChild({
        guardian_family_id: familyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob || undefined,
        gender: gender || undefined,
        mcc_id: mccId.trim() || undefined,
      });
      const family = families.find((f) => f.id === familyId);
      onCreated({ ...child, family_name: family?.family_name ?? familyId });
      notify(`${child.first_name} ${child.last_name} added.`);
      setFirstName("");
      setLastName("");
      setDob("");
      setGender("");
      setMccId("");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {canWrite && (
        <form className="record-card" onSubmit={handleSubmit}>
          <span className="record-tab kid">Child</span>
          <h3>New child record</h3>

          <div className="field-row">
            <div className="field">
              <label htmlFor="c_first">First name</label>
              <input id="c_first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="c_last">Last name</label>
              <input id="c_last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="c_dob">Date of birth</label>
              <input id="c_dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="c_gender">Gender</label>
              <select id="c_gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="c_mcc_id">MCC ID</label>
            <input id="c_mcc_id" value={mccId} onChange={(e) => setMccId(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="c_family">Guardian family</label>
            <select
              id="c_family"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a guardian family…
              </option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.family_name}
                </option>
              ))}
            </select>
            {families.length === 0 && (
              <p className="hint">No guardian families yet — add one in the Families tab first.</p>
            )}
          </div>

          <button className="submit-btn" type="submit" disabled={loading || families.length === 0}>
            {loading ? "Saving…" : "Add child"}
          </button>
        </form>
      )}

      <RosterList
        title="Children on record"
        items={children}
        emptyLabel="No children yet."
        renderRow={(c) => (
          <div className="roster-row">
            <span className="name">
              {c.first_name} {c.last_name}
            </span>
            <span className="meta">
              family: {c.family_name ?? c.guardian_families?.family_name ?? "—"}
            </span>
          </div>
        )}
      />
    </>
  );
}
