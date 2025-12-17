"use client";

import { X } from "lucide-react";

interface ClearFilterButtonProps {
  onClear: () => void;
}

/**
 * Shared clear button for filter dropdowns.
 * Handles click, keyboard, and pointer events properly to work within popover triggers.
 */
export function ClearFilterButton({ onClear }: ClearFilterButtonProps) {
  return (
    <span
      className="ml-1 inline-flex cursor-pointer hover:text-destructive"
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClear();
        }
      }}
    >
      <X className="h-3 w-3" />
    </span>
  );
}
