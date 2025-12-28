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
import { cn, truncateText } from "@/lib/utils";
import { QuickLeadDialog } from "@/components/dialogs/quick-lead-dialog";
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
  /** Contact ID for creating new leads */
  contactId?: number;
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
  contactId,
  allowCreate = false,
}: LeadSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Sort leads alphabetically by description
  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    return [...leads].sort((a, b) => a.description.localeCompare(b.description, "nb"));
  }, [leads]);

  // Filter leads locally based on query
  const filteredLeads = useMemo(() => {
    if (!query.trim()) return sortedLeads;
    const lowerQuery = query.toLowerCase();
    return sortedLeads.filter((l) => l.description.toLowerCase().includes(lowerQuery));
  }, [sortedLeads, query]);

  // Can only create if allowCreate is true and we have a companyId (leads require a company)
  const canCreate = allowCreate && !!companyId;

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
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
              <CommandEmpty>Ingen treff</CommandEmpty>
              {/* Create shortcut */}
              {canCreate && (
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
              {/* Leads list */}
              <CommandGroup heading="Leads">
                {filteredLeads.map((l) => (
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
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {canCreate && (
        <QuickLeadDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
          companyId={companyId!}
          contactId={contactId}
        />
      )}
    </div>
  );
}
