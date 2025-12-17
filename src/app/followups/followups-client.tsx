"use client";
import { useMemo, useState } from "react";
import { FollowupsList } from "@/components/followups-list";
import { UserFilter, type UserFilterValue } from "@/components/filters/user-filter";

export function FollowupsClient() {
  const [userFilter, setUserFilter] = useState<UserFilterValue>("mine");

  const { openEndpoint, completedEndpoint } = useMemo(() => {
    let params = "";
    if (userFilter === "all") {
      params = "all=1";
    } else if (userFilter === "excludeMine") {
      params = "excludeMine=1";
    } else if (typeof userFilter === "number") {
      params = `userId=${userFilter}`;
    }
    // "mine" = no params (defaults to current user's followups based on assignedToUserId)

    return {
      openEndpoint: params ? `/api/followups?${params}` : "/api/followups",
      completedEndpoint: params
        ? `/api/followups?completed=1&${params}`
        : "/api/followups?completed=1",
    };
  }, [userFilter]);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Oppgaver</h1>
        <UserFilter value={userFilter} onChange={setUserFilter} />
      </div>
      <div>
        <FollowupsList endpoint={openEndpoint} />
      </div>
      <div>
        <h2 className="text-lg font-medium mb-2">Fullførte</h2>
        <FollowupsList endpoint={completedEndpoint} variant="completed" />
      </div>
    </div>
  );
}
