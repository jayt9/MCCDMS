import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./components/Sidebar.jsx";
import SignIn from "./components/SignIn.jsx";
import FamilyForm from "./components/FamilyForm.jsx";
import ChildForm from "./components/ChildForm.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import Toast from "./components/Toast.jsx";
import { listFamilies, listChildren } from "./api";

const TAB_META = {
  families: { eyebrow: "Directory", title: "Guardian Families", blurb: "Every household unit. Every child must belong to one of these." },
  children: { eyebrow: "Directory", title: "Children", blurb: "Every child record is tied to a guardian family." },
  admin: { eyebrow: "Administration", title: "Users & Roles", blurb: "Invite staff and assign roles: admin, MCC staff, or MCP staff." },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [activeTab, setActiveTab] = useState("families");
  const [families, setFamilies] = useState([]);
  const [children, setChildren] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => setToast({ message: "", type: "success" }), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function notify(message, type = "success") {
    setToast({ message, type });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_profiles")
      .select("display_name, role, is_active")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          if (error) console.error("[user_profiles lookup]", error);
          setProfileError(
            error
              ? `No profile found for this account. Contact an admin. (${error.message})`
              : "No profile found for this account. Contact an admin."
          );
          return;
        }
        if (!data.is_active) {
          setProfileError("Your account has been deactivated.");
          return;
        }
        setProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const loadFamilies = useCallback(() => {
    listFamilies().then(setFamilies).catch((err) => notify(err.message, "error"));
  }, []);

  const loadChildren = useCallback(() => {
    listChildren().then(setChildren).catch((err) => notify(err.message, "error"));
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadFamilies();
    loadChildren();
  }, [profile, loadFamilies, loadChildren]);

  function handleSignOut() {
    supabase.auth.signOut();
    setProfile(null);
    setProfileError(null);
  }

  if (!session) {
    return (
      <>
        <SignIn notify={notify} />
        <Toast message={toast.message} type={toast.type} />
      </>
    );
  }

  if (profileError) {
    return (
      <div className="signin-screen">
        <div className="signin-wrap">
          <p className="mark">Makindu Children's Center · Data Management</p>
          <h1>Access denied</h1>
          <p>{profileError}</p>
          <button className="submit-btn" style={{ marginTop: 20 }} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const canWrite = profile.role === "admin" || profile.role === "mcc_staff";
  const tabs = ["families", "children", ...(profile.role === "admin" ? ["admin"] : [])];
  const meta = TAB_META[activeTab];

  return (
    <div className="app">
      <Sidebar
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
        counts={{ families: families.length, children: children.length }}
        profile={profile}
        onSignOut={handleSignOut}
      />
      <main className="main">
        <div className="main-head">
          <p className="eyebrow">{meta.eyebrow}</p>
          <h2>{meta.title}</h2>
          <p>{meta.blurb}</p>
        </div>

        {activeTab === "families" && (
          <FamilyForm
            families={families}
            canWrite={canWrite}
            onCreated={(f) => setFamilies((prev) => [f, ...prev])}
            notify={notify}
          />
        )}
        {activeTab === "children" && (
          <ChildForm
            families={families}
            children={children}
            canWrite={canWrite}
            onCreated={(c) => setChildren((prev) => [c, ...prev])}
            notify={notify}
          />
        )}
        {activeTab === "admin" && profile.role === "admin" && (
          <AdminPanel notify={notify} />
        )}
      </main>
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
