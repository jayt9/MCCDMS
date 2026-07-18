import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function SignIn({ notify }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
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
        <h1>Sign in</h1>

        <form className="record-card" onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <span className="record-tab guardian">Login</span>
          <h3>Staff sign in</h3>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="dev-note">
          Accounts are created by an admin. If you don't have one yet, ask an
          admin to invite you.
        </p>
      </div>
    </div>
  );
}
