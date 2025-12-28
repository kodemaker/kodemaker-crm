"use client";
import { useState, useMemo } from "react";
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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { ClearFilterButton } from "@/components/filters/clear-filter-button";
import { cn, truncateText } from "@/lib/utils";
import { QuickLeadDialog } from "@/components/dialogs/quick-lead-dialog";
import { NewLeadDialog } from "@/components/dialogs/new-lead-dialog";
import type { LeadStatus } from "@/types/api";

type Lead = {
  id: number;
  description: string;
  status: LeadStatus;
};

type LeadSelectorProps = {
  leads: Lead[] | undefined;
  selectedLead: Lead | null;
  onSelect: (lead: Lead | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  /** Company ID for creating new leads */
  companyId?: number;
  /** Company name for creating new leads */
  companyName?: string;
  /** Contact ID for creating new leads */
  contactId?: number;
  /** Contact name for creating new leads */
  contactName?: string;
  /** Whether to allow creating new leads inline */
  allowCreate?: boolean;
};

export function LeadSelector({
  leads,
  selectedLead,
  onSelect,
  open,
  onOpenChange,
  query,
  onQueryChange,
  companyId,
  companyName,
  contactId,
  contactName,
  allowCreate = false,
}: LeadSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    return [...leads].sort((a, b) => a.description.localeCompare(b.description, "nb"));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!query.trim()) return sortedLeads;
    const lowerQuery = query.toLowerCase();
    return sortedLeads.filter((l) => l.description.toLowerCase().includes(lowerQuery));
  }, [sortedLeads, query]);

  function handleCreated(newLead: { id: number; description: string }) {
    onSelect({ ...newLead, status: "NEW" });
    setCreateDialogOpen(false);
    onOpenChange(false);
    onQueryChange("");
  }

  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Lead</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between text-sm font-normal"
          >
            <span className="truncate flex-1 min-w-0 text-left">
              {selectedLead ? truncateText(selectedLead.description, 60) : "Velg lead…"}
            </span>
            {selectedLead ? (
              <ClearFilterButton onClear={() => {
                onSelect(null);
                onQueryChange("");
              }} />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
          <Command>
            <CommandInput
              autoFocus
              placeholder="Søk lead…"
              value={query}
              onValueChange={onQueryChange}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Tab") {
                  onOpenChange(false);
                }
              }}
            />
            <CommandList>
              {leads && leads.length > 0 && <CommandEmpty>Ingen treff</CommandEmpty>}
              {allowCreate && (
                <>
                  <CommandGroup>
                    <CommandItem
                      value="__create_new__"
                      onSelect={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Lag ny
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup heading="Leads">
                {leads && leads.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    Ingen laget enda
                  </div>
                ) : (
                  filteredLeads.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={l.description}
                      onSelect={() => {
                        onSelect(l);
                        onOpenChange(false);
                        onQueryChange("");
                      }}
                    >
                      {truncateText(l.description, 60)}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedLead?.id === l.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {allowCreate &&
        (companyId ? (
          <QuickLeadDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onCreated={handleCreated}
            companyId={companyId}
            contactId={contactId}
          />
        ) : (
          <NewLeadDialog
            trigger={null}
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            companyName={companyName}
            contactId={contactId}
            contactName={contactName}
            onCreated={() => {
              setCreateDialogOpen(false);
              onOpenChange(false);
              onQueryChange("");
            }}
          />
        ))}
    </div>
  );
}
