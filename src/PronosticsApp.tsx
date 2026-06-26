import { useEffect, useRef, useState } from "react";

// ============================================================
// SUPABASE CONFIGURATION
// Remplacez ces valeurs par celles de votre projet Supabase
// ============================================================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// ============================================================
// AUTH SCREEN STYLES
// ============================================================
const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;700&display=swap');
  :root {
    --bg: #070B14; --surface: #0F1525; --surface2: #161D30; --surface3: #1E2740;
    --border: #2A3550; --gold: #F0B429; --gold2: #FFD166; --green: #00D4AA;
    --red: #FF4757; --blue: #4A9EFF; --text: #E8EAF0; --text2: #8892A4; --text3: #4A5568;
    --radius: 12px; --radius-sm: 8px;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  #auth-screen {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, #070B14 0%, #0F1525 50%, #070B14 100%);
    padding: 20px;
  }
  .auth-card {
    background:var(--surface); border:1px solid var(--border); border-radius:16px;
    padding:40px 36px; width:100%; max-width:420px;
    box-shadow: 0 24px 80px rgba(0,0,0,.6);
  }
  .auth-logo { text-align:center; margin-bottom:32px; }
  .auth-logo h1 {
    font-family:'Space Grotesk',sans-serif; font-size:1.5rem; font-weight:700;
    color:var(--gold); margin-bottom:4px;
  }
  .auth-logo p { font-size:.82rem; color:var(--text3); }
  .auth-ball { font-size:3rem; display:block; margin-bottom:12px; }
  .auth-tabs { display:flex; gap:4px; margin-bottom:28px; background:var(--surface2); border-radius:var(--radius-sm); padding:4px; }
  .auth-tab {
    flex:1; padding:8px; border-radius:6px; border:none; background:transparent;
    color:var(--text2); font-family:'Inter',sans-serif; font-size:.85rem; font-weight:600;
    cursor:pointer; transition:all .15s;
  }
  .auth-tab.active { background:var(--gold); color:#000; }
  .auth-field { margin-bottom:16px; }
  .auth-label { font-size:.75rem; color:var(--text2); font-weight:500; margin-bottom:6px; display:block; }
  .auth-input {
    width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm);
    color:var(--text); font-family:'Inter',sans-serif; font-size:.9rem; padding:11px 14px;
    outline:none; transition:border-color .15s;
  }
  .auth-input:focus { border-color:var(--gold); }
  .auth-btn {
    width:100%; padding:12px; border-radius:var(--radius-sm); border:none;
    background:var(--gold); color:#000; font-family:'Inter',sans-serif; font-size:.92rem;
    font-weight:700; cursor:pointer; transition:all .15s; margin-top:8px;
  }
  .auth-btn:hover { background:var(--gold2); }
  .auth-btn:disabled { opacity:.5; cursor:not-allowed; }
  .auth-error {
    background:rgba(255,71,87,.1); border:1px solid rgba(255,71,87,.3); border-radius:var(--radius-sm);
    padding:10px 14px; font-size:.82rem; color:var(--red); margin-bottom:16px;
  }
  .auth-info {
    text-align:center; font-size:.76rem; color:var(--text3); margin-top:20px; line-height:1.6;
  }
  .auth-mode-badge {
    background:rgba(240,180,41,.1); border:1px solid rgba(240,180,41,.25); border-radius:6px;
    padding:8px 14px; text-align:center; font-size:.78rem; color:var(--gold);
    margin-bottom:20px; font-weight:500;
  }
  .auth-spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(0,0,0,.3); border-top-color:#000; border-radius:50%; animation:spin .6s linear infinite; vertical-align:middle; margin-right:6px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  #admin-panel { min-height:100vh; background:var(--bg); padding:24px; font-family:'Inter',sans-serif; }
  .admin-header { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px 24px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; }
  .admin-header h2 { font-family:'Space Grotesk',sans-serif; font-size:1.2rem; color:var(--gold); }
  .admin-section { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px 24px; margin-bottom:16px; }
  .admin-section h3 { font-size:.85rem; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.8px; margin-bottom:16px; }
  .admin-mode-grid { display:flex; gap:10px; flex-wrap:wrap; }
  .admin-mode-btn { padding:10px 18px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface2); color:var(--text2); font-family:'Inter',sans-serif; font-size:.84rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .admin-mode-btn.active { background:var(--gold); color:#000; border-color:var(--gold); }
  .admin-user-list { display:flex; flex-direction:column; gap:8px; }
  .admin-user-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.84rem; }
  .admin-user-name { font-weight:600; color:var(--text); }
  .admin-user-email { color:var(--text3); font-size:.76rem; }
  .admin-approve-btn { padding:5px 14px; border-radius:6px; border:none; background:var(--green); color:#000; font-size:.76rem; font-weight:700; cursor:pointer; }
  .admin-reject-btn { padding:5px 14px; border-radius:6px; border:none; background:var(--red); color:#fff; font-size:.76rem; font-weight:700; cursor:pointer; margin-left:6px; }
  .btn-logout { padding:8px 18px; border-radius:var(--radius-sm); border:1px solid rgba(255,71,87,.3); background:rgba(255,71,87,.08); color:var(--red); font-family:'Inter',sans-serif; font-size:.82rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.7rem; font-weight:700; }
  .status-pending { background:rgba(240,180,41,.15); color:var(--gold); }
  .status-approved { background:rgba(0,212,170,.15); color:var(--green); }
  .status-rejected { background:rgba(255,71,87,.15); color:var(--red); }
  .admin-panel-btn { width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid rgba(74,158,255,.3); background:rgba(74,158,255,.08); color:var(--blue); font-family:'Inter',sans-serif; font-size:.82rem; font-weight:600; cursor:pointer; transition:all .15s; margin-top:10px; }
`;

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { pseudo?: string };
};

type AppMode = "loading" | "auth" | "pending" | "app" | "admin";

export default function PronosticsApp() {
  const [mode, setMode] = useState<AppMode>("loading");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<"ouvert" | "manuel" | "ferme">("ouvert");
  const [pendingUsers, setPendingUsers] = useState<Array<{ id: string; email: string; pseudo: string; status: string }>>([]);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<unknown>(null);
  const appMountedRef = useRef(false);

  useEffect(() => {
    if (SUPABASE_URL === "YOUR_SUPABASE_URL") {
      setMode("app");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    script.onload = () => {
      // @ts-expect-error global supabase
      const { createClient } = window.supabase;
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseRef.current = client;
      initAuth(client);
    };
    script.onerror = () => setMode("app");
    document.head.appendChild(script);
  }, []);

  async function initAuth(client: unknown) {
    // @ts-expect-error supabase client
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      await handleLoggedInUser(client, session.user);
    } else {
      setMode("auth");
    }
    // @ts-expect-error supabase client
    client.auth.onAuthStateChange((_event: string, sess: unknown) => {
      // @ts-expect-error session
      if (sess?.user) handleLoggedInUser(client, sess.user);
      else { setMode("auth"); setUser(null); setIsAdmin(false); }
    });
  }

  async function handleLoggedInUser(client: unknown, u: SupabaseUser) {
    setUser(u);
    const pseudoVal = u.user_metadata?.pseudo || u.email?.split("@")[0] || "Joueur";
    setPseudo(pseudoVal);

    if (pseudoVal === "admin") {
      setIsAdmin(true);
      await loadAdminData(client);
      setMode("admin");
      return;
    }

    // @ts-expect-error supabase
    const { data: settings } = await client.from("settings").select("value").eq("key", "registration_mode").single();
    const regMode = settings?.value || "ouvert";
    setRegistrationMode(regMode as "ouvert" | "manuel" | "ferme");

    // @ts-expect-error supabase
    const { data: profile } = await client.from("user_profiles").select("status, pseudo").eq("user_id", u.id).single();

    if (!profile) {
      // @ts-expect-error supabase
      await client.from("user_profiles").insert({ user_id: u.id, email: u.email, pseudo: pseudoVal, status: regMode === "ouvert" ? "approved" : "pending" });
      setMode(regMode === "ouvert" ? "app" : "pending");
    } else if (profile.status === "approved") {
      if (profile.pseudo) setPseudo(profile.pseudo);
      setMode("app");
    } else if (profile.status === "rejected") {
      setError("Votre demande d'accès a été refusée.");
      // @ts-expect-error supabase
      await client.auth.signOut();
      setMode("auth");
    } else {
      setMode("pending");
    }
  }

  async function loadAdminData(client: unknown) {
    // @ts-expect-error supabase
    const { data: settings } = await client.from("settings").select("value").eq("key", "registration_mode").single();
    setRegistrationMode(settings?.value || "ouvert");
    // @ts-expect-error supabase
    const { data: users } = await client.from("user_profiles").select("*").order("created_at", { ascending: false });
    setPendingUsers(users || []);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const emailOrPseudo = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const client = supabaseRef.current;
    if (!client) { setLoading(false); return; }

    const loginEmail = emailOrPseudo.includes("@") ? emailOrPseudo : `${emailOrPseudo}@pronostics-sp26.local`;
    // @ts-expect-error supabase
    const { error: err } = await client.auth.signInWithPassword({ email: loginEmail, password });
    setLoading(false);
    if (err) setError(err.message === "Invalid login credentials" ? "Identifiants incorrects." : err.message);
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const pseudoInput = (form.elements.namedItem("pseudo") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const client = supabaseRef.current;
    if (!client) { setLoading(false); return; }
    if (registrationMode === "ferme") { setError("Les inscriptions sont fermées."); setLoading(false); return; }
    if (!pseudoInput || pseudoInput.length < 2) { setError("Pseudo trop court (min. 2 caractères)."); setLoading(false); return; }

    // @ts-expect-error supabase
    const { error: err } = await client.auth.signUp({ email, password, options: { data: { pseudo: pseudoInput } } });
    setLoading(false);
    if (err) setError(err.message);
    else if (registrationMode === "manuel") setMode("pending");
  }

  async function handleLogout() {
    const client = supabaseRef.current;
    if (client) {
      // @ts-expect-error supabase
      await client.auth.signOut();
    }
    setMode("auth");
    setUser(null);
    setIsAdmin(false);
    appMountedRef.current = false;
  }

  async function handleAdminModeChange(newMode: "ouvert" | "manuel" | "ferme") {
    const client = supabaseRef.current;
    if (!client) return;
    // @ts-expect-error supabase
    await client.from("settings").upsert({ key: "registration_mode", value: newMode });
    setRegistrationMode(newMode);
  }

  async function handleApproveUser(userId: string) {
    const client = supabaseRef.current;
    if (!client) return;
    // @ts-expect-error supabase
    await client.from("user_profiles").update({ status: "approved" }).eq("user_id", userId);
    await loadAdminData(client);
  }

  async function handleRejectUser(userId: string) {
    const client = supabaseRef.current;
    if (!client) return;
    // @ts-expect-error supabase
    await client.from("user_profiles").update({ status: "rejected" }).eq("user_id", userId);
    await loadAdminData(client);
  }

  // Mount the original app once "app" mode is active
  useEffect(() => {
    if (mode !== "app" || !containerRef.current || appMountedRef.current) return;
    appMountedRef.current = true;
    mountOriginalApp(containerRef.current, pseudo);
  }, [mode, pseudo]);

  // ============================================================
  // RENDER
  // ============================================================

  if (mode === "loading") {
    return (
      <>
        <style>{AUTH_CSS}</style>
        <div id="auth-screen">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <span className="auth-ball">⚽</span>
            <p style={{ color: "var(--text3)", fontSize: ".9rem" }}>Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  if (mode === "auth") {
    return (
      <>
        <style>{AUTH_CSS}</style>
        <div id="auth-screen">
          <div className="auth-card">
            <div className="auth-logo">
              <span className="auth-ball">⚽</span>
              <h1>Pronostics Saint-Paul 2026</h1>
              <p>Coupe du Monde FIFA 2026</p>
            </div>
            {registrationMode === "ferme" && authTab === "register" && (
              <div className="auth-mode-badge">🔒 Inscriptions fermées</div>
            )}
            {registrationMode === "manuel" && authTab === "register" && (
              <div className="auth-mode-badge">⏳ Inscriptions sur validation</div>
            )}
            <div className="auth-tabs">
              <button className={`auth-tab${authTab === "login" ? " active" : ""}`} onClick={() => { setAuthTab("login"); setError(""); }}>
                Connexion
              </button>
              <button className={`auth-tab${authTab === "register" ? " active" : ""}`} onClick={() => { setAuthTab("register"); setError(""); }}>
                Inscription
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            {authTab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-label">Pseudo ou Email</label>
                  <input className="auth-input" name="email" type="text" placeholder="admin ou votre@email.com" required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mot de passe</label>
                  <input className="auth-input" name="password" type="password" placeholder="••••••••" required />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading && <span className="auth-spinner" />}
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="auth-field">
                  <label className="auth-label">Pseudo</label>
                  <input className="auth-input" name="pseudo" type="text" placeholder="Votre pseudo" required minLength={2} maxLength={30} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input className="auth-input" name="email" type="email" placeholder="votre@email.com" required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mot de passe</label>
                  <input className="auth-input" name="password" type="password" placeholder="Min. 6 caractères" required minLength={6} />
                </div>
                <button className="auth-btn" type="submit" disabled={loading || registrationMode === "ferme"}>
                  {loading && <span className="auth-spinner" />}
                  {loading ? "Inscription..." : "S'inscrire"}
                </button>
              </form>
            )}
            <div className="auth-info">
              Pronostics FIFA 2026 — Compétition privée
            </div>
          </div>
        </div>
      </>
    );
  }

  if (mode === "pending") {
    return (
      <>
        <style>{AUTH_CSS}</style>
        <div id="auth-screen">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <span className="auth-ball">⏳</span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "var(--gold)", marginBottom: 12 }}>Demande en attente</h1>
            <p style={{ color: "var(--text2)", fontSize: ".88rem", lineHeight: 1.6, marginBottom: 24 }}>
              Votre inscription est en cours de validation par l'administrateur.
            </p>
            <button className="btn-logout" onClick={handleLogout}>← Se déconnecter</button>
          </div>
        </div>
      </>
    );
  }

  if (mode === "admin") {
    return (
      <>
        <style>{AUTH_CSS}</style>
        <div id="admin-panel">
          <div className="admin-header">
            <h2>⚙️ Panneau Administrateur</h2>
            <button className="btn-logout" onClick={handleLogout}>← Déconnexion</button>
          </div>
          <div className="admin-section">
            <h3>🔐 Mode d'inscription</h3>
            <div className="admin-mode-grid">
              {(["ouvert", "manuel", "ferme"] as const).map(m => (
                <button
                  key={m}
                  className={`admin-mode-btn${registrationMode === m ? " active" : ""}`}
                  onClick={() => handleAdminModeChange(m)}
                >
                  {m === "ouvert" ? "🟢 Ouvert" : m === "manuel" ? "🟡 Manuel (validation)" : "🔴 Fermé"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: ".75rem", color: "var(--text3)", marginTop: 12 }}>
              <strong style={{ color: "var(--text2)" }}>Ouvert</strong> : inscription libre.<br />
              <strong style={{ color: "var(--text2)" }}>Manuel</strong> : approbation requise.<br />
              <strong style={{ color: "var(--text2)" }}>Fermé</strong> : aucune nouvelle inscription.
            </p>
          </div>
          <div className="admin-section">
            <h3>👥 Participants ({pendingUsers.length})</h3>
            <div className="admin-user-list">
              {pendingUsers.length === 0 && <p style={{ color: "var(--text3)", fontSize: ".84rem" }}>Aucun participant.</p>}
              {pendingUsers.map(u => (
                <div key={u.id} className="admin-user-row">
                  <div>
                    <div className="admin-user-name">{u.pseudo}</div>
                    <div className="admin-user-email">{u.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`status-badge status-${u.status}`}>{u.status}</span>
                    {u.status === "pending" && (
                      <>
                        <button className="admin-approve-btn" onClick={() => handleApproveUser(u.id)}>✓ Approuver</button>
                        <button className="admin-reject-btn" onClick={() => handleRejectUser(u.id)}>✗ Refuser</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-section">
            <h3>🚀 Accès Application</h3>
            <p style={{ fontSize: ".84rem", color: "var(--text2)", marginBottom: 14 }}>
              L'admin peut accéder à l'application pour gérer les Résultats Réels.
            </p>
            <button className="admin-panel-btn" onClick={() => { setIsAdmin(false); setMode("app"); }}>
              ▶ Accéder à l'application
            </button>
          </div>
        </div>
      </>
    );
  }

  // mode === "app"
  return (
    <>
      <style>{AUTH_CSS}</style>
      {SUPABASE_URL !== "YOUR_SUPABASE_URL" && (
        <div style={{
          position: "fixed", top: 10, right: 10, zIndex: 9999,
          display: "flex", gap: 8, alignItems: "center"
        }}>
          <span style={{ fontSize: ".75rem", color: "var(--text3)", fontFamily: "'Inter',sans-serif" }}>
            {pseudo}
          </span>
          {isAdmin && (
            <button
              onClick={() => setMode("admin")}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(74,158,255,.3)", background: "rgba(74,158,255,.08)", color: "#4A9EFF", fontSize: ".75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >
              ⚙️ Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,71,87,.3)", background: "rgba(255,71,87,.08)", color: "#FF4757", fontSize: ".75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
          >
            ← Quitter
          </button>
        </div>
      )}
      <div ref={containerRef} id="app-host" />
    </>
  );
}

// ============================================================
// MOUNT ORIGINAL APP
// Loads CSS, HTML, then the app.js script from /public
// ============================================================
function mountOriginalApp(host: HTMLElement, pseudo: string) {
  // Inject Google Fonts
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;700&display=swap";
    document.head.appendChild(fontLink);
  }

  // Inject app CSS
  if (!document.getElementById("app-original-css")) {
    const styleEl = document.createElement("style");
    styleEl.id = "app-original-css";
    styleEl.textContent = ORIGINAL_CSS;
    document.head.appendChild(styleEl);
  }

  // Mount HTML
  host.innerHTML = ORIGINAL_HTML;

  // Pass pseudo to the app script via window global
  (window as Record<string, unknown>)._APP_PSEUDO = pseudo;

  // Load the app logic from /public/app.js
  const script = document.createElement("script");
  script.src = "/app.js?v=" + Date.now();
  script.onload = () => {
    console.log("[PronosticsApp] app.js loaded successfully");
  };
  script.onerror = () => {
    console.error("[PronosticsApp] Failed to load app.js");
  };
  document.body.appendChild(script);
}

// ============================================================
// ORIGINAL CSS
// ============================================================
const ORIGINAL_CSS = `
  :root {
    --bg: #070B14; --surface: #0F1525; --surface2: #161D30; --surface3: #1E2740;
    --border: #2A3550; --gold: #F0B429; --gold2: #FFD166; --green: #00D4AA;
    --red: #FF4757; --blue: #4A9EFF; --text: #E8EAF0; --text2: #8892A4; --text3: #4A5568;
    --radius: 12px; --radius-sm: 8px;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  #app-host { min-height:100vh; }
  .app-container { display:flex; min-height:100vh; }
  .sidebar { width:240px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; position:fixed; left:0; top:0; bottom:0; z-index:100; transition:transform .3s; }
  .sidebar-logo { padding:24px 20px 16px; border-bottom:1px solid var(--border); }
  .sidebar-logo h1 { font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700; color:var(--gold); letter-spacing:-.3px; line-height:1.2; }
  .sidebar-logo span { color:var(--text2); font-size:.75rem; font-weight:400; display:block; margin-top:2px; }
  .nav-section { padding:12px 0; }
  .nav-label { font-size:.65rem; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:var(--text3); padding:8px 20px 4px; }
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 20px; cursor:pointer; font-size:.85rem; font-weight:500; color:var(--text2); transition:all .15s; border-left:3px solid transparent; }
  .nav-item:hover { background:var(--surface2); color:var(--text); }
  .nav-item.active { background:rgba(240,180,41,.08); color:var(--gold); border-left-color:var(--gold); }
  .nav-item .icon { font-size:1rem; width:20px; text-align:center; }
  .profile-selector { padding:16px 20px; border-top:1px solid var(--border); margin-top:auto; }
  .profile-label { font-size:.65rem; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--text3); margin-bottom:8px; }
  .profile-select { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:.82rem; padding:8px 10px; cursor:pointer; outline:none; }
  .profile-select:focus { border-color:var(--gold); }
  .btn-add-profile { width:100%; margin-top:8px; background:rgba(240,180,41,.1); border:1px solid rgba(240,180,41,.3); color:var(--gold); border-radius:var(--radius-sm); padding:7px 10px; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .btn-add-profile:hover { background:rgba(240,180,41,.2); }
  .btn-import-profile { width:100%; margin-top:6px; background:rgba(74,158,255,.08); border:1px solid rgba(74,158,255,.25); color:var(--blue); border-radius:var(--radius-sm); padding:7px 10px; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .main { margin-left:240px; flex:1; min-width:0; overflow-x:hidden; display:flex; flex-direction:column; min-height:100vh; }
  .topbar { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
  .topbar-title { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; }
  .topbar-info { font-size:.8rem; color:var(--text2); }
  .current-profile-badge { background:rgba(240,180,41,.12); border:1px solid rgba(240,180,41,.3); color:var(--gold); border-radius:20px; padding:4px 12px; font-size:.78rem; font-weight:600; }
  .page-content { padding:24px 28px; flex:1; }
  .tab-pane { display:none; }
  .tab-pane.active { display:block; }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
  .card-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .card-header h3 { font-size:.95rem; font-weight:700; }
  .card-body { padding:16px 20px; }
  .group-tabs { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px; }
  .group-tab { padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:var(--surface2); color:var(--text2); font-size:.8rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .group-tab:hover { border-color:var(--gold); color:var(--gold); }
  .group-tab.active { background:var(--gold); color:#000; border-color:var(--gold); }
  .match-row { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(42,53,80,.6); }
  .match-row:last-child { border-bottom:none; }
  .match-team { display:flex; align-items:center; gap:8px; font-size:.88rem; font-weight:600; }
  .match-team.right { justify-content:flex-end; }
  .flag-img { width:24px; height:18px; object-fit:cover; border-radius:2px; flex-shrink:0; }
  .flag-text { font-size:1.2rem; line-height:1; }
  .team-name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px; }
  .score-input-group { display:flex; align-items:center; gap:6px; }
  .score-input { width:42px; height:42px; background:var(--surface3); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; text-align:center; outline:none; transition:border-color .15s; -moz-appearance:textfield; }
  .score-input::-webkit-outer-spin-button,.score-input::-webkit-inner-spin-button { -webkit-appearance:none; }
  .score-input:focus { border-color:var(--gold); }
  .score-input.filled { border-color:var(--green); background:rgba(0,212,170,.05); }
  .score-input:disabled { opacity:.4; cursor:not-allowed; border-color:var(--text3); }
  .score-sep { color:var(--text3); font-weight:700; font-size:1rem; }
  .match-date { display:none; }
  .standings-table { width:100%; border-collapse:collapse; font-size:.82rem; }
  .standings-table th { padding:8px 10px; text-align:center; font-size:.68rem; font-weight:600; letter-spacing:.8px; text-transform:uppercase; color:var(--text3); border-bottom:1px solid var(--border); }
  .standings-table th:first-child { text-align:left; padding-left:4px; }
  .standings-table td { padding:8px 10px; text-align:center; border-bottom:1px solid rgba(42,53,80,.4); font-variant-numeric:tabular-nums; }
  .standings-table td:first-child { text-align:left; }
  .standings-table tr:last-child td { border-bottom:none; }
  .team-cell { display:flex; align-items:center; gap:8px; font-weight:600; }
  .pos-badge { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; }
  .pos-badge.q1 { background:rgba(0,212,170,.2); color:var(--green); }
  .pos-badge.q2 { background:rgba(74,158,255,.2); color:var(--blue); }
  .pos-badge.q3 { background:rgba(240,180,41,.12); color:var(--gold); }
  .pos-badge.out { background:rgba(255,71,87,.08); color:var(--red); }
  .ko-round-header { display:flex; align-items:center; gap:12px; margin:24px 0 14px; }
  .ko-round-header h3 { font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:700; color:var(--gold); white-space:nowrap; }
  .ko-divider { flex:1; height:1px; background:var(--border); }
  .ko-matches-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:10px; margin-bottom:8px; }
  .ko-match-card { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 14px; display:flex; flex-direction:column; gap:10px; }
  .ko-teams { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; }
  .ko-team { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:600; }
  .ko-team.right { justify-content:flex-end; }
  .ko-score-grp { display:flex; align-items:center; gap:4px; }
  .btn-winner { padding:3px 10px; border-radius:4px; border:1px solid var(--border); background:var(--surface3); color:var(--text2); font-size:.72rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .btn-winner.selected-left { background:rgba(0,212,170,.2); border-color:var(--green); color:var(--green); }
  .btn-winner.selected-right { background:rgba(240,180,41,.2); border-color:var(--gold); color:var(--gold); }
  .btn-winner:disabled { opacity:.4; cursor:not-allowed; }
  .ko-winner-row { display:flex; justify-content:space-between; align-items:center; gap:6px; font-size:.72rem; color:var(--text3); }
  .lb-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border-bottom:1px solid rgba(42,53,80,.5); transition:background .15s; }
  .lb-row:hover { background:var(--surface2); }
  .lb-row:last-child { border-bottom:none; }
  .lb-rank { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:var(--text3); width:28px; text-align:center; flex-shrink:0; }
  .lb-rank.r1 { color:var(--gold); }
  .lb-rank.r2 { color:#C0C0C0; }
  .lb-rank.r3 { color:#CD7F32; }
  .lb-name { flex:1; font-weight:600; font-size:.92rem; }
  .lb-pts { font-family:'Space Grotesk',sans-serif; font-size:1.3rem; font-weight:700; color:var(--gold); }
  .lb-pts span { font-size:.72rem; color:var(--text3); font-family:'Inter',sans-serif; font-weight:400; margin-left:2px; }
  .lb-breakdown { font-size:.72rem; color:var(--text3); }
  .tab-pane#tab-bracket { overflow-x:auto; overflow-y:visible; }
  .bracket-outer { overflow:visible; padding:0 0 24px; }
  .bracket-scroll { position:relative; display:inline-flex; flex-direction:column; gap:16px; min-width:max-content; }
  .bracket-main { display:flex; align-items:stretch; gap:0; }
  .bk-col { display:flex; flex-direction:column; position:relative; overflow:visible; }
  .bk-hdr { height:32px; display:flex; align-items:center; justify-content:center; font-size:.58rem; font-weight:800; text-transform:uppercase; letter-spacing:1.2px; border-radius:6px 6px 0 0; white-space:nowrap; padding:0 8px; }
  .bk-slots { flex:1; display:flex; flex-direction:column; justify-content:space-around; gap:0; overflow:visible; }
  .bk-match { background:var(--surface2); border:1px solid var(--border); border-radius:7px; overflow:hidden; margin:3px 0; transition:border-color .15s; }
  .bk-match:hover { border-color:rgba(240,180,41,.4); }
  .bk-team { display:flex; align-items:center; gap:4px; padding:4px 7px; min-height:26px; font-size:.67rem; }
  .bk-team:first-child { border-bottom:1px solid var(--border); }
  .bk-team.bk-win { background:rgba(0,212,170,.12); color:#00D4AA; font-weight:700; }
  .bk-team.bk-win .bk-sc { color:#00D4AA; }
  .bk-team-name { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bk-sc { font-family:'Space Grotesk',sans-serif; font-size:.74rem; font-weight:700; color:var(--text3); min-width:14px; text-align:right; flex-shrink:0; }
  .bk-conn { flex-shrink:0; position:relative; }
  .bk-conn svg { display:block; }
  .bk-center { display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .bk-final-hdr { display:flex; align-items:center; justify-content:center; height:32px; font-size:.6rem; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:var(--gold); padding:5px 8px; background:rgba(240,180,41,.08); border:1px solid rgba(240,180,41,.3); border-radius:6px 6px 0 0; white-space:nowrap; }
  .bonus-field { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 14px; color:var(--text); font-family:'Inter',sans-serif; font-size:.9rem; width:100%; outline:none; transition:border-color .15s; }
  .bonus-field:focus { border-color:var(--gold); }
  .bonus-field:disabled { opacity:.4; cursor:not-allowed; }
  .stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; margin-top:16px; }
  .stat-card { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; text-align:center; }
  .stat-value { font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; color:var(--gold); line-height:1; }
  .stat-label { font-size:.75rem; color:var(--text3); margin-top:4px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); display:flex; align-items:center; justify-content:center; z-index:1000; opacity:0; pointer-events:none; transition:opacity .2s; }
  .modal-overlay.open { opacity:1; pointer-events:all; }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:24px; width:360px; max-width:calc(100vw - 40px); transform:translateY(20px); transition:transform .2s; }
  .modal-overlay.open .modal { transform:translateY(0); }
  .modal h3 { font-size:1.05rem; font-weight:700; margin-bottom:16px; }
  .modal input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:.9rem; padding:10px 12px; outline:none; margin-bottom:12px; transition:border-color .15s; }
  .modal input:focus { border-color:var(--gold); }
  .modal-actions { display:flex; gap:8px; justify-content:flex-end; }
  .btn { padding:8px 18px; border-radius:var(--radius-sm); font-size:.85rem; font-weight:600; cursor:pointer; border:none; transition:all .15s; }
  .btn-primary { background:var(--gold); color:#000; }
  .btn-primary:hover { background:var(--gold2); }
  .btn-secondary { background:var(--surface3); color:var(--text2); }
  .btn-secondary:hover { color:var(--text); }
  .section-intro { font-size:.82rem; color:var(--text2); margin-bottom:20px; line-height:1.5; }
  .tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:.7rem; font-weight:600; }
  .tag-green { background:rgba(0,212,170,.15); color:var(--green); }
  .tag-gold { background:rgba(240,180,41,.15); color:var(--gold); }
  .tag-blue { background:rgba(74,158,255,.15); color:var(--blue); }
  .tag-red { background:rgba(255,71,87,.15); color:var(--red); }
  .hamburger { display:none; }
  .scoring-notice { background:rgba(240,180,41,.06); border:1px solid rgba(240,180,41,.2); border-radius:var(--radius-sm); padding:12px 16px; font-size:.8rem; color:var(--text2); margin-bottom:16px; line-height:1.6; }
  .scoring-notice strong { color:var(--gold); }
  @media (max-width:800px) {
    .sidebar { transform:translateX(-100%); }
    .sidebar.open { transform:translateX(0); }
    .main { margin-left:0; }
    .hamburger { display:block; background:none; border:none; color:var(--text); font-size:1.4rem; cursor:pointer; margin-right:8px; }
    .page-content { padding:16px; }
    .ko-matches-grid { grid-template-columns:1fr; }
    .stat-grid { grid-template-columns:repeat(2,1fr); }
    .team-name { max-width:80px; }
  }
  .empty-state { text-align:center; padding:40px 20px; color:var(--text3); font-size:.9rem; }
  .empty-state .big { font-size:2.5rem; margin-bottom:10px; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
  .btn-random { background:#8B5CF6; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:.75rem; font-weight:600; cursor:pointer; }
  .btn-manual { background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:6px 12px; border-radius:6px; font-size:.75rem; font-weight:600; cursor:pointer; transition:all .15s; }
  .btn-manual.active { background:var(--gold); color:#000; border-color:var(--gold); }
  .r16-mode-bar { display:flex; align-items:center; gap:8px; margin:16px 0; padding:12px 16px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); }
  .r16-mode-bar span { font-size:.82rem; color:var(--text2); }
  .r16-mode-bar .mode-label { font-weight:700; color:var(--gold); }
  .emoji-btn { background:var(--surface3); border:2px solid var(--border); border-radius:var(--radius-sm); padding:5px 10px; font-size:1.3rem; cursor:pointer; transition:all .15s; line-height:1; }
  .emoji-btn:hover { border-color:var(--gold); }
  .emoji-btn.active { border-color:var(--gold); background:rgba(240,180,41,.15); }
  .lock-banner { background:rgba(255,71,87,.12); border:1px solid rgba(255,71,87,.3); border-radius:var(--radius-sm); padding:10px 14px; font-size:.82rem; color:var(--red); font-weight:600; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
  .settings-section { margin-bottom:24px; }
  .settings-section-title { font-size:.68rem; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--text3); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .settings-field-label { font-size:.75rem; color:var(--text2); margin-bottom:6px; font-weight:500; }
  .settings-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:.9rem; padding:10px 12px; outline:none; transition:border-color .15s; margin-bottom:10px; }
  .settings-input:focus { border-color:var(--gold); }
  .settings-input:disabled { opacity:.35; cursor:not-allowed; }
  .btn-set { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; border-radius:var(--radius-sm); font-size:.82rem; font-weight:600; cursor:pointer; border:none; transition:all .15s; }
  .btn-set-primary { background:var(--gold); color:#000; }
  .btn-set-neutral { background:var(--surface2); border:1px solid var(--border); color:var(--text); }
  .btn-set-neutral:hover { border-color:var(--gold); color:var(--gold); }
  .btn-set-sim { background:rgba(138,92,246,.15); border:1px solid rgba(138,92,246,.35); color:#a78bfa; }
  .btn-set-sim:hover { background:rgba(138,92,246,.25); }
  .btn-set-lock { background:rgba(240,180,41,.1); border:1px solid rgba(240,180,41,.3); color:var(--gold); }
  .btn-set-lock:hover { background:rgba(240,180,41,.2); }
  .btn-set-lock.is-locked { background:rgba(255,71,87,.08); border-color:rgba(255,71,87,.25); color:var(--red); cursor:not-allowed; opacity:.6; }
  .btn-set:disabled { opacity:.35; cursor:not-allowed; pointer-events:none; }
  .btn-set-danger { background:rgba(255,71,87,.1); border:1px solid rgba(255,71,87,.3); color:var(--red); }
  .btn-set-danger:hover { background:rgba(255,71,87,.2); }
  .sym-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media (max-width:600px) { .sym-grid { grid-template-columns:1fr; } }
  .sym-card { background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; display:flex; flex-direction:column; gap:10px; }
  .sym-card-title { font-size:.75rem; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.6px; }
  .toggle-row { display:flex; align-items:center; gap:12px; padding:12px 0; }
  .toggle-slider { width:42px; height:24px; background:var(--surface3); border:1px solid var(--border); border-radius:12px; position:relative; cursor:pointer; transition:background .2s,border-color .2s; flex-shrink:0; }
  .toggle-slider.on { background:var(--gold); border-color:var(--gold); }
  .toggle-slider::after { content:''; position:absolute; width:18px; height:18px; background:#fff; border-radius:50%; top:2px; left:2px; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.4); }
  .toggle-slider.on::after { left:20px; }
  .toggle-label { font-size:.85rem; color:var(--text2); }
  .toggle-label strong { color:var(--text); }
  #importFileInput,#importProfileInput,#importCompetitionInput { display:none; }
  @media print {
    body { background:#fff !important; color:#000 !important; }
    .sidebar,.topbar,.page-content > .tab-pane:not(#tab-bracket) { display:none !important; }
    .tab-pane#tab-bracket { display:block !important; overflow:visible !important; }
    .main { margin-left:0 !important; overflow:visible !important; }
    @page { size:A3 landscape; margin:5mm; }
    .bracket-scroll { overflow:visible !important; zoom:0.87; }
  }
`;

// ============================================================
// ORIGINAL HTML
// ============================================================
const ORIGINAL_HTML = `
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <h3>➕ Nouveau Profil</h3>
    <div style="margin-bottom:12px">
      <div style="font-size:.75rem;color:var(--text2);margin-bottom:8px">Choisissez votre emoji :</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="emojiPicker">
        <button type="button" class="emoji-btn active" onclick="selectEmoji('😎',this)">😎</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🥷',this)">🥷</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('👤',this)">👤</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🕵️',this)">🕵️</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🧑‍🚀',this)">🧑‍🚀</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('👹',this)">👹</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🦊',this)">🦊</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🦄',this)">🦄</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🐉',this)">🐉</button>
        <button type="button" class="emoji-btn" onclick="selectEmoji('🚀',this)">🚀</button>
      </div>
    </div>
    <input type="text" id="newProfileName" placeholder="Nom du joueur..." maxlength="30" />
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="createProfile()">Créer</button>
    </div>
  </div>
</div>
<div class="modal-overlay" id="modalDelOverlay">
  <div class="modal">
    <h3>🗑️ Supprimer ce profil ?</h3>
    <p style="color:var(--text2);font-size:.88rem;margin-bottom:16px">Cette action est irréversible.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeDelModal()">Annuler</button>
      <button class="btn" style="background:var(--red);color:#fff" onclick="confirmDeleteProfile()">Supprimer</button>
    </div>
  </div>
</div>
<div class="modal-overlay" id="modalImportDataOverlay">
  <div class="modal">
    <h3>📂 Importer des données</h3>
    <p style="color:var(--text2);font-size:.88rem;margin-bottom:16px">Choisissez le type d'import :</p>
    <div style="display:flex;flex-direction:column;gap:9px">
      <button class="btn btn-primary" onclick="closeImportDataModal(); document.getElementById('importProfileInput').click();" style="width:100%">👤 Importer un profil</button>
      <button class="btn btn-primary" onclick="closeImportDataModal(); document.getElementById('importCompetitionInput').click();" style="background:var(--gold);color:#000;width:100%">🏆 Importer une compétition</button>
      <button class="btn btn-secondary" onclick="closeImportDataModal()" style="width:100%">Annuler</button>
    </div>
  </div>
</div>
<div class="modal-overlay" id="modalConfirmOverlay">
  <div class="modal">
    <h3 id="modalConfirmTitle">Confirmer</h3>
    <p id="modalConfirmMsg" style="color:var(--text2);font-size:.88rem;margin-bottom:16px"></p>
    <div style="display:flex;flex-direction:column;gap:9px">
      <button class="btn btn-primary" id="modalConfirmBtn2" style="display:none;width:100%">Option 2</button>
      <button class="btn btn-primary" id="modalConfirmBtn" style="width:100%">Confirmer</button>
      <button class="btn btn-secondary" onclick="closeConfirmModal()" style="width:100%">Annuler</button>
    </div>
  </div>
</div>
<input type="file" id="importFileInput" accept=".json" onchange="handleImportFile(event)" />
<input type="file" id="importProfileInput" accept=".json" onchange="handleImportProfileFile(event)" />
<input type="file" id="importCompetitionInput" accept=".json" onchange="handleImportCompetitionFile(event)" />
<div class="app-container">
  <nav class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <h1>⚽ Coupe du Monde<br>2026</h1>
      <span>Pronostics FIFA</span>
    </div>
    <div class="nav-section">
      <div class="nav-label">Navigation</div>
      <div class="nav-item active" onclick="showTab('groups')" data-tab="groups"><span class="icon">🏟️</span> <span class="nav-text-groups">Matchs de Poules</span></div>
      <div class="nav-item" onclick="showTab('standings')" data-tab="standings"><span class="icon">📊</span> <span class="nav-text-standings">Classement</span></div>
      <div class="nav-item" onclick="showTab('knockout')" data-tab="knockout"><span class="icon">⚡</span> <span class="nav-text-knockout">Phase Finale</span></div>
      <div class="nav-item" onclick="showTab('bracket')" data-tab="bracket"><span class="icon">🗂️</span> <span class="nav-text-bracket">Arborescence</span></div>
      <div class="nav-item" onclick="showTab('bonus')" data-tab="bonus"><span class="icon">🌟</span> <span class="nav-text-bonus">Bonus</span></div>
      <div class="nav-item" onclick="showTab('leaderboard')" data-tab="leaderboard"><span class="icon">🏆</span> <span class="nav-text-leaderboard">Classement Général</span></div>
      <div class="nav-item" onclick="showTab('settings')" data-tab="settings"><span class="icon">⚙️</span> Paramètres</div>
    </div>
    <div class="profile-selector">
      <div class="profile-label">Profil actif</div>
      <select class="profile-select" id="profileSelect" onchange="switchProfile(this.value)"></select>
      <button class="btn-add-profile" onclick="openModal()">+ Nouveau profil</button>
      <button class="btn-import-profile" onclick="openImportDataModal()">+ Importer données (json)</button>
    </div>
  </nav>
  <div class="main">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="hamburger" id="hamburger" onclick="toggleSidebar()">☰</button>
        <span class="topbar-title" id="topbarTitle">Phase de Groupes</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="topbar-info" id="topbarInfo"></span>
        <span class="current-profile-badge" id="profileBadge"></span>
      </div>
    </div>
    <div class="page-content">
      <div class="tab-pane active" id="tab-groups">
        <p class="section-intro">Entrez vos pronostics pour les 72 matchs de poule (12 groupes de 4 équipes, 6 matchs chacun).</p>
        <div class="group-tabs" id="groupTabs"></div>
        <div class="card" id="groupMatchesCard">
          <div class="card-header"><span id="groupMatchesTitle">🏟️ Groupe A</span></div>
          <div class="card-body" id="groupMatchesList"></div>
        </div>
      </div>
      <div class="tab-pane" id="tab-standings">
        <p class="section-intro">Classement automatique. Les 12 premiers, 12 deuxièmes et 8 meilleurs troisièmes se qualifient.</p>
        <div class="group-tabs" id="standingsGroupTabs"></div>
        <div class="card" id="standingsCard"><div class="card-body" id="standingsContent"></div></div>
      </div>
      <div class="tab-pane" id="tab-knockout">
        <p class="section-intro">Phase éliminatoire. En cas de match nul, sélectionnez le vainqueur aux tirs au but.</p>
        <div class="r16-mode-bar" id="r16ModeBar"><span>Mode 1/16 :</span><span class="mode-label" id="r16ModeLabel">Automatique (FIFA 2026)</span></div>
        <div id="annexCInfo" style="margin:0 0 16px"></div>
        <div id="manualR16Content"></div>
        <div id="knockoutContent"></div>
      </div>
      <div class="tab-pane" id="tab-bracket">
        <p class="section-intro">Arborescence visuelle du tournoi.</p>
        <div id="bracketViz"></div>
      </div>
      <div class="tab-pane" id="tab-bonus">
        <div id="buteurLockBanner"></div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><h3>🥾 Meilleur Buteur</h3></div>
          <div class="card-body">
            <p style="font-size:.82rem;color:var(--text2);margin-bottom:10px">Entrez votre pronostic pour le meilleur buteur (+10 pts si correct).</p>
            <input type="text" class="bonus-field" id="topScorerInput" placeholder="Ex: Kylian Mbappé" oninput="saveTopScorer()" />
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>📈 Statistiques</h3></div>
          <div class="card-body"><div class="stat-grid" id="bonusStats"></div></div>
        </div>
      </div>
      <div class="tab-pane" id="tab-leaderboard">
        <div class="scoring-notice">
          <strong>Système de points :</strong> Calculé sur la base des <strong>Résultats Réels</strong>.<br>
          • <strong>Groupes :</strong> Bon résultat : <strong>+1 pt</strong> · Score exact : <strong>+3 pts</strong><br>
          • <strong>Phase finale :</strong> Équipe au bon tour : <strong>+1/2/4/8/12 pts</strong><br>
          • <strong>Bonus Choc (KO) :</strong> Bonne affiche + score exact : <strong>Points x2</strong><br>
          • <strong>Vainqueurs :</strong> Champion : <strong>+30 pts</strong> · Meilleur buteur : <strong>+10 pts</strong>
        </div>
        <div class="card" id="leaderboardCard"><div class="card-body" id="leaderboardContent"></div></div>
      </div>
      <div class="tab-pane" id="tab-settings"><div id="settingsContent"></div></div>
    </div>
  </div>
</div>
`;
