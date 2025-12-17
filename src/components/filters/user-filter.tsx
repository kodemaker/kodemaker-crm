"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Check, Filter, Loader2, User, UserMinus, Users } from "lucide-react";
import { ClearFilterButton } from "@/components/filters/clear-filter-button";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type UserFilterValue = "mine" | "all" | "excludeMine" | number;

export type UserData = {
  id: number;
  firstName: string;
  lastName: string;
};

export interface UserFilterProps {
  value: UserFilterValue;
  onChange: (value: UserFilterValue) => void;
  className?: string;
  /** The value that represents "no filter" state. Defaults to "mine". */
  defaultValue?: UserFilterValue;
  /** Label to show when filter is in default state. Defaults to showing the value name. */
  defaultLabel?: string;
  /** Custom labels for filter options */
  labels?: {
    mine?: string;
    excludeMine?: string;
  };
  /** Hide filter and user icons on the button. Useful when part of a larger filter bar. */
  hideIcons?: boolean;
}

export function UserFilter({
  value,
  onChange,
  className,
  defaultValue = "mine",
  defaultLabel,
  labels,
  hideIcons = false,
}: UserFilterProps) {
  const mineLabel = labels?.mine ?? "Mine";
  const excludeMineLabel = labels?.excludeMine ?? "Uten mine";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: users, isLoading } = useSWR<UserData[]>("/api/users");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!query) return users;
    const lowerQuery = query.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(lowerQuery) ||
        u.lastName.toLowerCase().includes(lowerQuery) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(lowerQuery)
    );
  }, [users, query]);

  const selectedUser = useMemo(() => {
    if (typeof value !== "number") return null;
    return users?.find((u) => u.id === value) ?? null;
  }, [users, value]);

  // Reset to default if the selected user no longer exists (e.g., was deleted)
  useEffect(() => {
    if (typeof value === "number" && users && !users.some((u) => u.id === value)) {
      onChange(defaultValue);
    }
  }, [value, users, onChange, defaultValue]);

  const displayText = useMemo(() => {
    // Use custom label for default value if provided
    if (value === defaultValue && defaultLabel) return defaultLabel;
    if (value === "mine") return mineLabel;
    if (value === "all") return "Alle";
    if (value === "excludeMine") return excludeMineLabel;
    if (selectedUser) {
      return `${selectedUser.firstName} ${selectedUser.lastName}`;
    }
    // Show loading indicator while fetching users if a specific user is selected
    if (typeof value === "number" && isLoading) {
      return "Laster...";
    }
    return "Ukjent bruker";
  }, [value, selectedUser, isLoading, defaultValue, defaultLabel, mineLabel, excludeMineLabel]);

  const displayIcon = useMemo(() => {
    if (isLoading && typeof value === "number") {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (value === "all") return <Users className="h-4 w-4" />;
    if (value === "excludeMine") {
      return labels?.excludeMine ? <Users className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  }, [value, isLoading, labels?.excludeMine]);

  const isFiltered = value !== defaultValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Filter: ${displayText}`}
          disabled={isLoading && !users}
          size={hideIcons ? "sm" : "default"}
          className={cn(
            "justify-between gap-2",
            isFiltered && "border-primary/50 bg-primary/5",
            hideIcons && "h-8",
            className
          )}
        >
          {!hideIcons && (
            <Filter
              className={cn("h-4 w-4", isFiltered ? "text-primary" : "text-muted-foreground")}
              aria-hidden="true"
            />
          )}
          <span>{displayText}</span>
          {!hideIcons && displayIcon}
          {hideIcons && isFiltered && (
            <ClearFilterButton
              onClear={() => {
                onChange(defaultValue);
                setOpen(false);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Søk bruker..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Ingen treff</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={mineLabel}
                onSelect={() => {
                  onChange("mine");
                  setOpen(false);
                  setQuery("");
                }}
              >
                <User className="mr-2 h-4 w-4" />
                {mineLabel}
                <Check
                  className={cn("ml-auto h-4 w-4", value === "mine" ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
              {defaultValue !== "all" && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Alle
                  <Check
                    className={cn("ml-auto h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              )}
              <CommandItem
                value={excludeMineLabel}
                onSelect={() => {
                  onChange("excludeMine");
                  setOpen(false);
                  setQuery("");
                }}
              >
                {labels?.excludeMine ? (
                  <Users className="mr-2 h-4 w-4" />
                ) : (
                  <UserMinus className="mr-2 h-4 w-4" />
                )}
                {excludeMineLabel}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === "excludeMine" ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            </CommandGroup>
            {isLoading ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Brukere">
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Laster brukere...
                  </div>
                </CommandGroup>
              </>
            ) : filteredUsers.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Brukere">
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.firstName} ${user.lastName}`}
                      onSelect={() => {
                        onChange(user.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      {user.firstName} {user.lastName}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
