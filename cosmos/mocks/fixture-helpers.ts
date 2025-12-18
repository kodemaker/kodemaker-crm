import type { PaginatedResponse } from "@/types/api";

/**
 * Helper to wrap items in a paginated response format for fixture mocks.
 *
 * @param items - The array of items to wrap
 * @param hasMore - Whether there are more items (defaults to false)
 * @param totalCount - Total count of items (defaults to items.length)
 * @returns PaginatedResponse object
 */
export function paginate<T>(
  items: T[],
  hasMore = false,
  totalCount?: number
): PaginatedResponse<T> {
  return {
    items,
    hasMore,
    totalCount: totalCount ?? items.length,
  };
}
