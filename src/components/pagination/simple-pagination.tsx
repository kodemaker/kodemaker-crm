"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type SimplePaginationProps = {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Variant for different contexts */
  variant?: "default" | "compact";
};

/**
 * A simple pagination component with Previous/Next buttons and page indicator.
 *
 * @example
 * ```tsx
 * <SimplePagination
 *   currentPage={1}
 *   totalPages={5}
 *   onPageChange={(page) => setPage(page)}
 * />
 * ```
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  variant = "default",
}: SimplePaginationProps) {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const buttonSize = variant === "compact" ? "sm" : "default";
  const containerPadding = variant === "compact" ? "py-2" : "py-4";
  const iconSize = variant === "compact" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={`flex items-center justify-center gap-2 ${containerPadding}`}>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        aria-label="Forrige side"
      >
        {isLoading && currentPage > 1 ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <ChevronLeft className={iconSize} />
        )}
      </Button>
      <span className="text-sm text-muted-foreground min-w-[100px] text-center">
        Side {currentPage} av {totalPages}
      </span>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        aria-label="Neste side"
      >
        {isLoading && currentPage < totalPages ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <ChevronRight className={iconSize} />
        )}
      </Button>
    </div>
  );
}
