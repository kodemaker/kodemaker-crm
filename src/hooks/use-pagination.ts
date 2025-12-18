"use client";
import useSWR from "swr";
import { useState, useCallback, useEffect, useRef } from "react";
import type { PaginatedResponse } from "@/types/api";

type UsePaginationOptions = {
  /** SWR revalidation options */
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
};

type UsePaginationResult<T> = {
  /** Array of items for the current page */
  items: T[];
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more items after current page */
  hasMore: boolean;
  /** Total count of items */
  totalCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether data is being revalidated */
  isValidating: boolean;
  /** Error if any occurred */
  error: Error | undefined;
  /** Set current page */
  setPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Revalidate data */
  mutate: () => Promise<PaginatedResponse<T> | undefined>;
};

/**
 * Hook for page-based pagination using SWR.
 *
 * @param baseUrl - The API endpoint URL (without pagination params)
 * @param limit - Number of items to fetch per page
 * @param options - Additional options
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const { items, currentPage, totalPages, setPage, isLoading } = usePagination<FollowupItemType>(
 *   "/api/followups?contactId=123",
 *   10
 * );
 * ```
 */
export function usePagination<T>(
  baseUrl: string | null,
  limit: number,
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { revalidateOnFocus = false, revalidateOnReconnect = false } = options;
  const [page, setPageState] = useState(1);
  const prevBaseUrlRef = useRef(baseUrl);

  // Reset page to 1 when baseUrl changes (e.g., filter changes)
  useEffect(() => {
    if (prevBaseUrlRef.current !== baseUrl) {
      setPageState(1);
      prevBaseUrlRef.current = baseUrl;
    }
  }, [baseUrl]);

  // Build URL with pagination params
  const url = baseUrl
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}limit=${limit}&page=${page}`
    : null;

  const { data, isLoading, isValidating, error, mutate } = useSWR<PaginatedResponse<T>>(url, {
    revalidateOnFocus,
    revalidateOnReconnect,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.totalCount / limit) : 0;
  const hasMore = data ? data.hasMore : false;

  // Remove upper bound validation to avoid stale totalPages issue
  // Server will return empty results if page exceeds bounds
  const setPage = useCallback((newPage: number) => {
    if (newPage >= 1) {
      setPageState(newPage);
    }
  }, []);

  const nextPage = useCallback(() => {
    if (hasMore || page < totalPages) {
      setPageState(page + 1);
    }
  }, [page, totalPages, hasMore]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPageState(page - 1);
    }
  }, [page]);

  return {
    items: data?.items ?? [],
    currentPage: page,
    totalPages,
    hasMore,
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isValidating,
    error,
    setPage,
    nextPage,
    prevPage,
    mutate,
  };
}
