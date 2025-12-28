"use client";

import { useState, useMemo, useCallback, KeyboardEvent } from "react";

export interface UseSearchableSelectOptions<T> {
  /** All available items to search through */
  items: T[] | undefined;
  /** Function to extract searchable text from an item */
  getSearchText: (item: T) => string;
  /** Optional custom sort function. Defaults to alphabetical by search text */
  sortFn?: (a: T, b: T) => number;
}

export interface UseSearchableSelectReturn<T> {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Whether the popover is open */
  open: boolean;
  /** Set the popover open state */
  setOpen: (open: boolean) => void;
  /** Filtered and sorted items based on current query */
  filteredItems: T[];
  /** Keyboard handler for the trigger button - enables type-to-search */
  handleTriggerKeyDown: (e: KeyboardEvent) => void;
  /** Keyboard handler for the search input - handles escape/tab */
  handleInputKeyDown: (e: KeyboardEvent) => void;
  /** Reset the search state (query and close popover) */
  reset: () => void;
}

/**
 * Custom hook for managing searchable select/combobox state.
 * Extracts common logic used across all searchable dropdowns in the app.
 *
 * Features:
 * - Query state management
 * - Local filtering with useMemo
 * - Keyboard navigation (type-to-search on trigger)
 * - Alphabetical sorting by default
 */
export function useSearchableSelect<T>({
  items,
  getSearchText,
  sortFn,
}: UseSearchableSelectOptions<T>): UseSearchableSelectReturn<T> {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Default sort: alphabetical by search text
  const defaultSort = useCallback(
    (a: T, b: T) => getSearchText(a).localeCompare(getSearchText(b), "nb"),
    [getSearchText]
  );

  const filteredItems = useMemo(() => {
    if (!items) return [];

    // Sort items
    const sorted = [...items].sort(sortFn ?? defaultSort);

    // If no query, return all sorted items
    if (!query.trim()) return sorted;

    // Filter by query
    const lowerQuery = query.toLowerCase();
    return sorted.filter((item) =>
      getSearchText(item).toLowerCase().includes(lowerQuery)
    );
  }, [items, query, getSearchText, sortFn, defaultSort]);

  // Keyboard handler for the trigger button
  // Enables type-to-search: typing a character opens the popover and starts the search
  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (open) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.length === 1) {
        // Single character typed - open and start search with that character
        setOpen(true);
        setQuery(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        // Backspace/Delete - open with empty search
        setOpen(true);
        setQuery("");
      }
    },
    [open]
  );

  // Keyboard handler for the search input
  // Handles escape and tab to close the popover
  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") {
        setOpen(false);
      }
    },
    []
  );

  // Reset the search state
  const reset = useCallback(() => {
    setQuery("");
    setOpen(false);
  }, []);

  return {
    query,
    setQuery,
    open,
    setOpen,
    filteredItems,
    handleTriggerKeyDown,
    handleInputKeyDown,
    reset,
  };
}
