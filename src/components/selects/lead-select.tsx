"use client";

import { useState } from "react";
import useSWR from "swr";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QuickLeadDialog } from "@/components/dialogs/quick-lead-dialog";
import { truncateText } from "@/lib/utils";
import type { LeadStatus } from "@/types/api";

export type LeadOption = {
  id: number;
  description: string;
  status: LeadStatus;
};

export interface LeadSelectProps {
  /** Currently selected lead */
  value: LeadOption | null;
  /** Callback when lead changes */
  onChange: (lead: LeadOption | null) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow creating new leads inline */
  allowCreate?: boolean;
  /** Company ID for filtering leads and creating new ones */
  companyId?: number;
  /** Contact ID for filtering leads and creating new ones */
  contactId?: number;
  /** Whether to allow clearing the selection */
  allowClear?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Lead select component with inline creation support.
 *
 * Features:
 * - Fetches leads filtered by company/contact
 * - Optional "Lag ny" inline creation (requires companyId)
 * - Auto-selects newly created lead
 */
export function LeadSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Velg lead...",
  allowCreate = false,
  companyId,
  contactId,
  allowClear = false,
  className,
}: LeadSelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Build the API URL with filters
  const buildApiUrl = () => {
    if (!popoverOpen) return null;
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", String(companyId));
    if (contactId) params.set("contactId", String(contactId));
    const queryString = params.toString();
    return queryString ? `/api/leads?${queryString}` : "/api/leads";
  };

  const { data: leads } = useSWR<LeadOption[]>(buildApiUrl());

  function handleCreateClick() {
    setCreateDialogOpen(true);
  }

  function handleCreated(newLead: { id: number; description: string }) {
    // Auto-select the newly created lead
    onChange({ ...newLead, status: "NEW" });
    setCreateDialogOpen(false);
    setPopoverOpen(false);
  }

  // Can only create if we have a companyId (leads require a company)
  const canCreate = allowCreate && !!companyId;

  return (
    <>
      <SearchableSelect
        items={leads}
        value={value}
        onChange={onChange}
        getLabel={(l) => truncateText(l.description, 40)}
        getValue={(l) => l.id}
        placeholder={placeholder}
        searchPlaceholder="Sok lead..."
        disabled={disabled}
        allowCreate={canCreate}
        onCreateClick={handleCreateClick}
        createLabel="Lag ny"
        groupHeading="Leads"
        allowClear={allowClear}
        className={className}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      />

      {canCreate && (
        <QuickLeadDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
          companyId={companyId!}
          contactId={contactId}
        />
      )}
    </>
  );
}
