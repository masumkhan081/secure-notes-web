import { useEffect, useId, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import {
  INITIAL_PAGE_QUERY,
  canGoPrevious,
  getCurrentCursor,
  popPreviousCursor,
  pushNextCursor,
  retryCurrentPage,
  type CursorPageQuery,
  type PageInfo,
} from "../../lib/pagination";
import type { User } from "../auth/auth.schema";
import { listAdminInterestUsers, listAdminInterests } from "./admin.api";
import type { AdminInterestGroup } from "./admin.schema";

type Props = {
  token: string;
};

export function AdminInterestsPage({ token }: Props) {
  const headingId = useId();

  const [groupsQuery, setGroupsQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [groups, setGroups] = useState<AdminInterestGroup[]>([]);
  const [groupsPageInfo, setGroupsPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState("");

  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [membersQuery, setMembersQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [memberInterestName, setMemberInterestName] = useState("");
  const [members, setMembers] = useState<User[]>([]);
  const [membersPageInfo, setMembersPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");

  const groupsCursor = getCurrentCursor(groupsQuery);
  const membersCursor = getCurrentCursor(membersQuery);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadGroups() {
      setIsLoadingGroups(true);
      setGroupsError("");
      setGroupsPageInfo(null);
      setGroups([]);

      try {
        const page = await listAdminInterests(
          token,
          groupsCursor,
          controller.signal,
        );
        if (ignore || controller.signal.aborted) return;
        setGroups(page.items);
        setGroupsPageInfo(page.pageInfo);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setGroupsError(
          error instanceof Error
            ? error.message
            : "Failed to load interest groups.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingGroups(false);
        }
      }
    }

    void loadGroups();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, groupsCursor, groupsQuery.revision]);

  useEffect(() => {
    if (selectedInterest === null) {
      setMemberInterestName("");
      setMembers([]);
      setMembersPageInfo(null);
      setMembersError("");
      setIsLoadingMembers(false);
      return;
    }

    const targetInterest = selectedInterest;
    const controller = new AbortController();
    let ignore = false;

    async function loadMembers() {
      setIsLoadingMembers(true);
      setMembersError("");
      setMembersPageInfo(null);
      setMembers([]);

      try {
        const page = await listAdminInterestUsers(
          token,
          targetInterest,
          membersCursor,
          controller.signal,
        );
        if (ignore || controller.signal.aborted) return;
        setMemberInterestName(page.interest);
        setMembers(page.items);
        setMembersPageInfo(page.pageInfo);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setMembersError(
          error instanceof Error
            ? error.message
            : "Failed to load interest members.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingMembers(false);
        }
      }
    }

    void loadMembers();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, selectedInterest, membersCursor, membersQuery.revision]);

  function openInterestMembers(interest: string) {
    setSelectedInterest(interest);
    setMembersQuery(INITIAL_PAGE_QUERY);
  }

  const isMemberView = selectedInterest !== null;
  const activeQuery = isMemberView ? membersQuery : groupsQuery;
  const activePageInfo = isMemberView ? membersPageInfo : groupsPageInfo;
  const isLoading = isMemberView ? isLoadingMembers : isLoadingGroups;
  const activeError = isMemberView ? membersError : groupsError;

  const hasPrevious = canGoPrevious(activeQuery);
  const canGoNext =
    !isLoading &&
    !activeError &&
    Boolean(activePageInfo?.hasMore && activePageInfo.nextCursor);

  return (
    <section aria-labelledby={headingId} className="mt-6 space-y-6">
      <h2 id={headingId} className="text-xl font-semibold text-slate-900">
        Interests
      </h2>

      {isMemberView ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white p-4">
            <h3 className="break-words text-base font-semibold text-slate-900">
              Interest: {memberInterestName || selectedInterest}
            </h3>

            <button
              type="button"
              onClick={() => setSelectedInterest(null)}
              className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Back to interests
            </button>
          </div>

          {isLoadingMembers && (
            <p role="status" className="text-sm text-slate-600">
              Loading members...
            </p>
          )}

          {!isLoadingMembers && membersError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
            >
              <p>{membersError}</p>
              <button
                type="button"
                onClick={() => setMembersQuery(retryCurrentPage)}
                className="rounded border border-red-400 bg-white px-3 py-1.5 font-medium text-red-800 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoadingMembers && !membersError && members.length === 0 && (
            <p className="rounded border border-slate-300 bg-white p-4 text-sm text-slate-700">
              {membersQuery.cursorHistory.length === 1
                ? "No members found for this interest."
                : "No members found on this page."}
            </p>
          )}

          {!isLoadingMembers && !membersError && members.length > 0 && (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="rounded border border-slate-300 bg-white p-4"
                >
                  <div className="space-y-1">
                    <h4 className="break-words text-base font-semibold text-slate-900">
                      {member.name}
                    </h4>
                    <p className="break-words text-sm text-slate-700">
                      {member.email}
                    </p>
                    <p className="text-xs text-slate-600">
                      Role: {member.role} · Interests:{" "}
                      {member.interests.length > 0
                        ? member.interests.join(", ")
                        : "None"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <PaginationControls
            ariaLabel="Interest members pagination"
            canGoPrevious={hasPrevious}
            canGoNext={canGoNext}
            onPrevious={() => setMembersQuery(popPreviousCursor)}
            onNext={() => {
              const nextCursor = membersPageInfo?.nextCursor;
              if (!nextCursor) return;
              setMembersQuery((prev) => pushNextCursor(prev, nextCursor));
            }}
          />
        </section>
      ) : (
        <section className="space-y-4">
          {isLoadingGroups && (
            <p role="status" className="text-sm text-slate-600">
              Loading interest groups...
            </p>
          )}

          {!isLoadingGroups && groupsError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
            >
              <p>{groupsError}</p>
              <button
                type="button"
                onClick={() => setGroupsQuery(retryCurrentPage)}
                className="rounded border border-red-400 bg-white px-3 py-1.5 font-medium text-red-800 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoadingGroups && !groupsError && groups.length === 0 && (
            <p className="rounded border border-slate-300 bg-white p-4 text-sm text-slate-700">
              {groupsQuery.cursorHistory.length === 1
                ? "No interest groups found."
                : "No interest groups found on this page."}
            </p>
          )}

          {!isLoadingGroups && !groupsError && groups.length > 0 && (
            <ul className="space-y-3">
              {groups.map((group) => (
                <li
                  key={group.interest}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="break-words text-base font-semibold text-slate-900">
                      {group.interest}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {group.userCount}{" "}
                      {group.userCount === 1 ? "user" : "users"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openInterestMembers(group.interest)}
                    className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                  >
                    View members
                  </button>
                </li>
              ))}
            </ul>
          )}

          <PaginationControls
            ariaLabel="Interest groups pagination"
            canGoPrevious={hasPrevious}
            canGoNext={canGoNext}
            onPrevious={() => setGroupsQuery(popPreviousCursor)}
            onNext={() => {
              const nextCursor = groupsPageInfo?.nextCursor;
              if (!nextCursor) return;
              setGroupsQuery((prev) => pushNextCursor(prev, nextCursor));
            }}
          />
        </section>
      )}
    </section>
  );
}
