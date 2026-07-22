import { supabase } from "./supabaseClient";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function authedFetch(path, opts = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...opts.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const get = (path) => authedFetch(path);
const post = (path, data) => authedFetch(path, { method: "POST", body: JSON.stringify(data) });
const put = (path, data) => authedFetch(path, { method: "PUT", body: JSON.stringify(data) });

// ─── Families ──────────────────────────────────────────────
export const listFamilies = () => get("/families");
export const getFamily = (id) => get(`/families/${id}`);
export const createFamily = (data) => post("/families", data);
export const updateFamily = (id, data) => put(`/families/${id}`, data);

// ─── Children ──────────────────────────────────────────────
export const listChildren = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/children${qs ? `?${qs}` : ""}`);
};
export const getChild = (id) => get(`/children/${id}`);
export const createChild = (data) => post("/children", data);
export const updateChild = (id, data) => put(`/children/${id}`, data);

// ─── Admin ─────────────────────────────────────────────────
export const listUsers = () => get("/admin/users");
export const inviteUser = (data) => post("/admin/users", data);
export const setUserRole = (id, role) => put(`/admin/users/${id}/role`, { role });
export const deactivateUser = (id) => put(`/admin/users/${id}/deactivate`, {});

// ─── Me ────────────────────────────────────────────────────
export const markPasswordChanged = () => put("/me/password-changed", {});
