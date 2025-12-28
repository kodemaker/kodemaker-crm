"use client";

import { useState } from "react";
import useSWR from "swr";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QuickCompanyDialog } from "@/components/dialogs/quick-company-dialog";

export type CompanyOption = {
  id: number;
  name: string;
  emailDomain?: string | null;
};

export interface CompanySelectProps {
  /** Currently selected company */
  value: CompanyOption | null;
  /** Callback when company changes */
  onChange: (company: CompanyOption | null) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow creating new companies inline */
  allowCreate?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Company select component with inline creation support.
 *
 * Features:
 * - Fetches all companies on open (local filtering)
 * - Alphabetical sorting
 * - Optional "Lag ny" inline creation
 * - Auto-selects newly created company
 */
export function CompanySelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Velg organisasjon",
  allowCreate = true,
  className,
}: CompanySelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch all companies when popover is open
  const { data: companies } = useSWR<CompanyOption[]>(
    popoverOpen ? "/api/companies" : null
  );

  function handleCreateClick() {
    setCreateDialogOpen(true);
  }

  function handleCreated(newCompany: { id: number; name: string }) {
    // Auto-select the newly created company
    onChange({ id: newCompany.id, name: newCompany.name });
    setCreateDialogOpen(false);
    setPopoverOpen(false);
  }

  return (
    <>
      <SearchableSelect
        items={companies}
        value={value}
        onChange={onChange}
        getLabel={(c) => c.name}
        getValue={(c) => c.id}
        placeholder={placeholder}
        searchPlaceholder="Sok organisasjon..."
        disabled={disabled}
        allowCreate={allowCreate}
        onCreateClick={handleCreateClick}
        createLabel="Lag ny"
        groupHeading="Organisasjoner"
        className={className}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      />

      {allowCreate && (
        <QuickCompanyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
