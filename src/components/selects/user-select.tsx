"use client";

import { useState } from "react";
import useSWR from "swr";
import { SearchableSelect } from "@/components/ui/searchable-select";

export type UserOption = {
  id: number;
  firstName: string;
  lastName: string;
};

export interface UserSelectProps {
  /** Currently selected user */
  value: UserOption | null;
  /** Callback when user changes */
  onChange: (user: UserOption | null) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow clearing the selection */
  allowClear?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * User select component for assigning tasks/followups.
 *
 * Features:
 * - Fetches all users on open
 * - Alphabetical sorting by full name
 * - NO create option (users are managed externally)
 * - NO "Ingen" option (use allowClear for clearing)
 */
export function UserSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Velg bruker",
  allowClear = false,
  className,
}: UserSelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data: users } = useSWR<UserOption[]>(
    popoverOpen ? "/api/users" : null
  );

  function getFullName(user: UserOption): string {
    return `${user.firstName} ${user.lastName}`;
  }

  return (
    <SearchableSelect
      items={users}
      value={value}
      onChange={onChange}
      getLabel={getFullName}
      getValue={(u) => u.id}
      placeholder={placeholder}
      searchPlaceholder="Sok bruker..."
      disabled={disabled}
      allowCreate={false}
      allowClear={allowClear}
      groupHeading="Brukere"
      className={className}
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
    />
  );
}
