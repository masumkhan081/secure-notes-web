import { useEffect, useId, useRef } from "react";
import type { User } from "../auth/auth.schema";

type Props = {
  user: User | null;
  isLoading: boolean;
  error: string;
  focusKey: string;
  onClose: () => void;
};

export function AdminUserDetail({
  user,
  isLoading,
  error,
  focusKey,
  onClose,
}: Props) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sectionRef.current?.focus();
  }, [focusKey]);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="rounded border border-slate-300 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold text-slate-900">
          User profile
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {isLoading && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          Loading user...
        </p>
      )}

      {!isLoading && error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLoading && !error && user && (
        <dl className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-sm text-slate-800">
          <div>
            <dt className="inline font-medium text-slate-900">Name: </dt>
            <dd className="inline break-words">{user.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-900">Email: </dt>
            <dd className="inline break-words">{user.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-900">Role: </dt>
            <dd className="inline">{user.role}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-900">Interests: </dt>
            <dd className="inline break-words">
              {user.interests.length > 0 ? user.interests.join(", ") : "None"}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-900">ID: </dt>
            <dd className="inline font-mono text-xs text-slate-700">
              {user.id}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
