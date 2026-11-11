import { useState } from "react";

export default function App() {
  const [status, setStatus] = useState("Not checked");
  const [pending, setPending] = useState(false);

  async function checkConnection() {
    setPending(true);
    setStatus("Connecting...");

    try {
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error("VITE_API_URL is missing");
      }

      const response = await fetch(`${apiUrl}/api/health`);
      const data: unknown = await response.json();

      if (
        !response.ok ||
        typeof data !== "object" ||
        data === null ||
        !("status" in data) ||
        data.status !== "ok"
      ) {
        throw new Error("The API did not return a healthy response");
      }

      setStatus("Connected to the backend successfully.");
    } catch (error: unknown) {
      setStatus(
        error instanceof Error ? error.message : "Connection failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1>Secure Notes</h1>
      <p>Private notes and public posts.</p>

      <button
        type="button"
        onClick={checkConnection}
        disabled={pending}
      >
        {pending ? "Connecting..." : "Check API connection"}
      </button>

      <p role="status">{status}</p>
    </main>
  );
}