"use client";

import { useState } from "react";
import useSWR from "swr";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QuickContactDialog } from "@/components/dialogs/quick-contact-dialog";

export type ContactOption = {
  id: number;
  firstName: string;
  lastName: string;
};

export interface ContactSelectProps {
  /** Currently selected contact */
  value: ContactOption | null;
  /** Callback when contact changes */
  onChange: (contact: ContactOption | null) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow creating new contacts inline */
  allowCreate?: boolean;
  /** If provided, filters contacts to only those in this company */
  companyId?: number;
  /** Custom className */
  className?: string;
}

/**
 * Contact select component with inline creation support.
 *
 * Features:
 * - Fetches contacts on open (optionally filtered by company)
 * - Alphabetical sorting by full name
 * - Optional "Lag ny" inline creation
 * - Auto-selects newly created contact
 * - When companyId is provided, new contacts are auto-linked to that company
 */
export function ContactSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Velg kontakt",
  allowCreate = true,
  companyId,
  className,
}: ContactSelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Build the API URL - optionally filter by company
  const apiUrl = popoverOpen
    ? companyId
      ? `/api/contacts?companyId=${companyId}`
      : "/api/contacts"
    : null;

  const { data: contacts } = useSWR<ContactOption[]>(apiUrl);

  function getFullName(contact: ContactOption): string {
    return `${contact.firstName} ${contact.lastName}`;
  }

  function handleCreateClick() {
    setCreateDialogOpen(true);
  }

  function handleCreated(newContact: { id: number; firstName: string; lastName: string }) {
    // Auto-select the newly created contact
    onChange(newContact);
    setCreateDialogOpen(false);
    setPopoverOpen(false);
  }

  return (
    <>
      <SearchableSelect
        items={contacts}
        value={value}
        onChange={onChange}
        getLabel={getFullName}
        getValue={(c) => c.id}
        placeholder={placeholder}
        searchPlaceholder="Sok kontakt..."
        disabled={disabled}
        allowCreate={allowCreate}
        onCreateClick={handleCreateClick}
        createLabel="Lag ny"
        groupHeading="Kontakter"
        className={className}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      />

      {allowCreate && (
        <QuickContactDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
          companyId={companyId}
        />
      )}
    </>
  );
}
