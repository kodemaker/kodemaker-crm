"use client";

import { ReactNode } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { useSearchableSelect } from "@/hooks/use-searchable-select";

export interface SearchableSelectProps<T> {
  /** All available items */
  items: T[] | undefined;
  /** Currently selected value */
  value: T | null;
  /** Callback when value changes */
  onChange: (value: T | null) => void;
  /** Extract display label from an item */
  getLabel: (item: T) => string;
  /** Extract unique value/key from an item */
  getValue: (item: T) => string | number;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Placeholder text in search input */
  searchPlaceholder?: string;
  /** Message shown when no items match search */
  emptyMessage?: string;
  /** Message shown when the list is completely empty (no items exist at all) */
  emptyListMessage?: string;
  /** Whether selection can be cleared */
  allowClear?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether to allow creating new items */
  allowCreate?: boolean;
  /** Callback when create button is clicked */
  onCreateClick?: () => void;
  /** Label for create button (e.g. "Lag ny") */
  createLabel?: string;
  /** Heading for the items group */
  groupHeading?: string;
  /** Custom className for the trigger button */
  className?: string;
  /** Whether the popover is controlled externally */
  open?: boolean;
  /** Callback when popover open state changes (for controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Custom render function for items */
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
}

/**
 * Generic searchable select/combobox component.
 *
 * Features:
 * - Search with local filtering
 * - Alphabetical sorting
 * - Optional "Lag ny" create button
 * - Type-to-search keyboard navigation
 */
export function SearchableSelect<T>({
  items,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = "Velg...",
  searchPlaceholder = "Sok...",
  emptyMessage = "Ingen treff",
  emptyListMessage = "Ingen laget enda",
  allowClear = false,
  disabled = false,
  allowCreate = false,
  onCreateClick,
  createLabel = "Lag ny",
  groupHeading,
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  renderItem,
}: SearchableSelectProps<T>) {
  const {
    query,
    setQuery,
    open: internalOpen,
    setOpen: setInternalOpen,
    filteredItems,
    handleTriggerKeyDown,
    handleInputKeyDown,
  } = useSearchableSelect({
    items,
    getSearchText: getLabel,
  });

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const selectedLabel = value ? getLabel(value) : null;
  const selectedValue = value ? getValue(value) : null;

  function handleSelect(item: T) {
    onChange(item);
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    onChange(null);
    setOpen(false);
    setQuery("");
  }

  function handleCreateClick() {
    onCreateClick?.();
    // Keep popover open - the create dialog will handle closing
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="truncate flex-1 min-w-0 text-left">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput
            autoFocus
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleInputKeyDown}
          />
          <CommandList>
            {/* Only show "Ingen treff" when searching, not when list is empty */}
            {items && items.length > 0 && <CommandEmpty>{emptyMessage}</CommandEmpty>}

            {/* Create shortcut - always visible when allowCreate is true */}
            {allowCreate && (
              <>
                <CommandGroup>
                  <CommandItem value="__create_new__" onSelect={handleCreateClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    {createLabel}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Items list */}
            <CommandGroup heading={groupHeading}>
              {allowClear && value && (
                <CommandItem value="__clear__" onSelect={handleClear}>
                  <span className="text-muted-foreground">Fjern valg</span>
                </CommandItem>
              )}
              {items && items.length === 0 ? (
                <div className="py-2 px-2 text-sm text-muted-foreground">{emptyListMessage}</div>
              ) : (
                filteredItems.map((item) => {
                  const itemValue = getValue(item);
                  const itemLabel = getLabel(item);
                  const isSelected = selectedValue === itemValue;

                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemLabel}
                      onSelect={() => handleSelect(item)}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          {itemLabel}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </>
                      )}
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
