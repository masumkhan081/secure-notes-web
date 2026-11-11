import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import type { LoginResponse } from "./features/auth/auth.schema";

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
    <main>
      <h1>Secure Notes</h1>

      {notice && <p role="status">{notice}</p>}

      {session ? (
        <section>
          <h2>Welcome, {session.user.name}</h2>
          <p>Role: {session.user.role}</p>

          <button
            type="button"
            onClick={() => {
              setSession(null);
              setMode("login");
              setNotice("You have logged out.");
            }}
          >
            Log out
          </button>
        </section>
      ) : (
        <>
          <nav aria-label="Account access">
            <button
              type="button"
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setNotice("");
              }}
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