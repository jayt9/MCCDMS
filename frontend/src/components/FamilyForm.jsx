import { useState } from "react";
import { createFamily } from "../api";
import RosterList from "./RosterList.jsx";

export default function FamilyForm({ families, canWrite, onCreated, notify }) {
  const [familyName, setFamilyName] = useState("");
  const [primaryContact, setPrimaryContact] = useState("");
  const [relationship, setRelationship] = useState("");
  const [village, setVillage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    try {
      const family = await createFamily({
        family_name: familyName.trim(),
        primary_contact: primaryContact.trim() || undefined,
        relationship: relationship.trim() || undefined,
        village: village.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      });
      onCreated(family);
      notify(`Family "${family.family_name}" added.`);
      setFamilyName("");
      setPrimaryContact("");
      setRelationship("");
      setVillage("");
      setContactPhone("");
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
          <span className="record-tab guardian">Family</span>
          <h3>New guardian family</h3>

          <div className="field">
            <label htmlFor="f_name">Family name</label>
            <input
              id="f_name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Mwangi Family"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f_contact">Primary contact</label>
              <input id="f_contact" value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f_relationship">Relationship</label>
              <input
                id="f_relationship"
                placeholder="Grandmother, Uncle…"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f_village">Village</label>
              <input id="f_village" value={village} onChange={(e) => setVillage(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f_phone">Contact phone</label>
              <input id="f_phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Add family"}
          </button>
        </form>
      )}

      <RosterList
        title="Families on record"
        items={families}
        emptyLabel="No guardian families yet."
        renderRow={(f) => (
          <div className="roster-row">
            <span className="name">{f.family_name}</span>
            <span className="meta">{f.village ?? "—"}</span>
          </div>
        )}
      />
    </>
  );
}
