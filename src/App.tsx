import { useEffect, useState } from "react";
import { AdminNotesPage } from "./features/admin/AdminNotesPage";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { AuthForm } from "./features/auth/AuthForm";
import type { LoginResponse, User } from "./features/auth/auth.schema";
import { NotesPage } from "./features/notes/NotesPage";

type Session = LoginResponse & {
  expiresAt: number;
};

type AuthenticatedTab = "my-notes" | "admin-users" | "admin-notes";

function navButtonClass(active: boolean): string {
  return `rounded border px-4 py-2 text-sm font-medium ${
    active
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-400 bg-white text-slate-800 hover:bg-slate-100"
  }`;
}

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<AuthenticatedTab>("my-notes");
  const [notice, setNotice] = useState("");

  const accessToken = session?.accessToken;
  const expiresAt = session?.expiresAt;

  // Tie expiry strictly to the login token and deadline so profile refreshes never extend the window.
  useEffect(() => {
    if (!accessToken || expiresAt === undefined) return;

    function expireSession() {
      setSession(null);
      setMode("login");
      setActiveTab("my-notes");
      setNotice("Your session expired. Please log in again.");
    }

    const remainingMs = Math.max(0, expiresAt - Date.now());
    const timer = window.setTimeout(expireSession, remainingMs);

    window.addEventListener("auth-expired", expireSession);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("auth-expired", expireSession);
    };
  }, [accessToken, expiresAt]);

  function handleCurrentUserUpdated(updatedUser: User) {
    setSession((prev) =>
      prev && prev.user.id === updatedUser.id
        ? { ...prev, user: updatedUser }
        : prev,
    );
  }

  const isAdmin = session?.user.role === "ADMIN";
  const visibleTab: AuthenticatedTab = isAdmin ? activeTab : "my-notes";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Secure Notes</h1>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          {notice}
        </p>
      )}

      {session ? (
        <>
          <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded border border-slate-300 bg-white p-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Welcome, {session.user.name}
              </h2>
              <p className="text-sm text-slate-600">Role: {session.user.role}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSession(null);
                setMode("login");
                setActiveTab("my-notes");
                setNotice("You have logged out.");
              }}
              className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Log out
            </button>
          </section>

          <nav aria-label="Workspace" className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={visibleTab === "my-notes"}
              onClick={() => setActiveTab("my-notes")}
              className={navButtonClass(visibleTab === "my-notes")}
            >
              My notes
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  aria-pressed={visibleTab === "admin-users"}
                  onClick={() => setActiveTab("admin-users")}
                  className={navButtonClass(visibleTab === "admin-users")}
                >
                  Users
                </button>

                <button
                  type="button"
                  aria-pressed={visibleTab === "admin-notes"}
                  onClick={() => setActiveTab("admin-notes")}
                  className={navButtonClass(visibleTab === "admin-notes")}
                >
                  All notes
                </button>
              </>
            )}
          </nav>

          {visibleTab === "my-notes" && (
            <NotesPage key={session.user.id} token={session.accessToken} />
          )}

          {visibleTab === "admin-users" && isAdmin && (
            <AdminUsersPage
              key={session.user.id}
              token={session.accessToken}
              currentUserId={session.user.id}
              onCurrentUserUpdated={handleCurrentUserUpdated}
            />
          )}

          {visibleTab === "admin-notes" && isAdmin && (
            <AdminNotesPage key={session.user.id} token={session.accessToken} />
          )}
        </>
      ) : (
        <>
          <nav aria-label="Account access" className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setNotice("");
              }}
              className={navButtonClass(mode === "login")}
            >
              Log in
            </button>

            <button
              type="button"
              aria-pressed={mode === "register"}
              onClick={() => {
                setMode("register");
                setNotice("");
              }}
              className={navButtonClass(mode === "register")}
            >
              Create account
            </button>
          </nav>

          <AuthForm
            key={mode}
            mode={mode}
            onLogin={(value) => {
              setSession({
                ...value,
                expiresAt: Date.now() + value.expiresIn * 1000,
              });
              setActiveTab("my-notes");
              setNotice("");
            }}
            onRegistered={() => {
              setMode("login");
              setNotice("Account created. You can now log in.");
            }}
          />
        </>
      )}
    </main>
  );
}
