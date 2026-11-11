import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import type { LoginResponse } from "./features/auth/auth.schema";
import { NotesPage } from "./features/notes/NotesPage";

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!session) return;

    function expireSession() {
      setSession(null);
      setMode("login");
      setNotice("Your session expired. Please log in again.");
    }

    const timer = window.setTimeout(
      expireSession,
      session.expiresIn * 1000,
    );

    window.addEventListener("auth-expired", expireSession);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("auth-expired", expireSession);
    };
  }, [session]);

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
                setNotice("You have logged out.");
              }}
              className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Log out
            </button>
          </section>

          <NotesPage key={session.user.id} token={session.accessToken} />
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
              className={`rounded border px-4 py-2 text-sm font-medium ${
                mode === "login"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-400 bg-white text-slate-800 hover:bg-slate-100"
              }`}
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
              className={`rounded border px-4 py-2 text-sm font-medium ${
                mode === "register"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-400 bg-white text-slate-800 hover:bg-slate-100"
              }`}
            >
              Create account
            </button>
          </nav>

          <AuthForm
            key={mode}
            mode={mode}
            onLogin={(value) => {
              setSession(value);
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