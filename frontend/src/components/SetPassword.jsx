import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function SetPassword({ onDone, notify }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      notify("Password must be at least 8 characters.", "error");
      return;
    }
    if (password !== confirm) {
      notify("Passwords don't match.", "error");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      notify("Password set. Welcome aboard.");
      onDone();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signin-screen">
      <div className="signin-wrap">
        <p className="mark">Makindu Children's Center · Data Management</p>
        <h1>Set your password</h1>

        <form className="record-card" onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <span className="record-tab guardian">Welcome</span>
          <h3>Choose a password</h3>

          <div className="field">
            <label htmlFor="new_password">New password</label>
            <input
              id="new_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirm_password">Confirm password</label>
            <input
              id="confirm_password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
