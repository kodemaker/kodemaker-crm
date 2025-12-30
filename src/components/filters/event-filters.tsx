"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Check, Filter, X } from "lucide-react";
import { ClearFilterButton } from "@/components/filters/clear-filter-button";
import { UserFilter, type UserFilterValue } from "@/components/filters/user-filter";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import type { ActivityEventType } from "@/types/api";

export type EventFilters = {
  types: ActivityEventType[];
  companyId?: number;
  contactId?: number;
  userFilter: UserFilterValue;
  fromDate?: Date;
  toDate?: Date;
};

type EventFiltersProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
};

type CompanyData = { id: number; name: string };
type ContactData = { id: number; firstName: string; lastName: string };

// Simplified type filter with 3 categories
type FilterTypeOption = "comment" | "lead" | "email";

const FILTER_TYPE_OPTIONS: { value: FilterTypeOption; label: string; apiTypes: ActivityEventType[] }[] = [
  { value: "comment", label: "Kommentar", apiTypes: ["comment_created"] },
  { value: "lead", label: "Lead", apiTypes: ["lead_created", "lead_status_changed"] },
  { value: "email", label: "E-post", apiTypes: ["email_received"] },
];

// Convert filter types to API types
function filterTypesToApiTypes(filterTypes: FilterTypeOption[]): ActivityEventType[] {
  return filterTypes.flatMap(
    (ft) => FILTER_TYPE_OPTIONS.find((o) => o.value === ft)?.apiTypes ?? []
  );
}

// Convert API types to filter types
function apiTypesToFilterTypes(apiTypes: ActivityEventType[]): FilterTypeOption[] {
  const result: FilterTypeOption[] = [];
  for (const option of FILTER_TYPE_OPTIONS) {
    if (option.apiTypes.some((t) => apiTypes.includes(t))) {
      result.push(option.value);
    }
  }
  return result;
}

export function EventFiltersBar({ filters, onChange }: EventFiltersProps) {
  const hasFilters =
    filters.types.length > 0 ||
    filters.companyId ||
    filters.contactId ||
    filters.userFilter !== "all" ||
    filters.fromDate ||
    filters.toDate;

  const clearFilters = () => {
    onChange({
      types: [],
      companyId: undefined,
      contactId: undefined,
      userFilter: "all",
      fromDate: undefined,
      toDate: undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 m-4 rounded-lg bg-muted">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <EventTypeFilter
        value={filters.types}
        onChange={(types) => onChange({ ...filters, types })}
      />
      <CompanyFilter
        value={filters.companyId}
        onChange={(companyId) => onChange({ ...filters, companyId })}
      />
      <ContactFilter
        value={filters.contactId}
        onChange={(contactId) => onChange({ ...filters, contactId })}
      />
      <UserFilter
        value={filters.userFilter}
        onChange={(userFilter) => onChange({ ...filters, userFilter })}
        defaultValue="all"
        defaultLabel="Laget av"
        labels={{ mine: "Meg", excludeMine: "Alle andre" }}
        hideIcons
      />
      <DateRangePicker
        value={
          filters.fromDate || filters.toDate
            ? { from: filters.fromDate, to: filters.toDate }
            : undefined
        }
        onValueChange={(range) =>
          onChange({ ...filters, fromDate: range?.from, toDate: range?.to })
        }
        placeholder="Periode"
        className={cn(
          "h-8",
          (filters.fromDate || filters.toDate) && "border-primary/50 bg-primary/5"
        )}
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
          <X className="h-4 w-4 mr-1" />
          Nullstill
        </Button>
      )}
    </div>
  );
}

function EventTypeFilter({
  value,
  onChange,
}: {
  value: ActivityEventType[];
  onChange: (value: ActivityEventType[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const filterTypes = apiTypesToFilterTypes(value);

  const toggleFilterType = (filterType: FilterTypeOption) => {
    const newFilterTypes = filterTypes.includes(filterType)
      ? filterTypes.filter((t) => t !== filterType)
      : [...filterTypes, filterType];
    onChange(filterTypesToApiTypes(newFilterTypes));
  };

  const getSelectedLabel = () => {
    if (filterTypes.length === 0) return "Type";
    if (filterTypes.length === 1) {
      return FILTER_TYPE_OPTIONS.find((o) => o.value === filterTypes[0])?.label ?? "Type";
    }
    return `${filterTypes.length} typer`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", filterTypes.length > 0 && "border-primary/50 bg-primary/5")}
        >
          {getSelectedLabel()}
          {filterTypes.length > 0 && (
            <ClearFilterButton onClear={() => { onChange([]); setOpen(false); }} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {FILTER_TYPE_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggleFilterType(option.value)}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      filterTypes.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CompanyFilter({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: companies } = useSWR<CompanyData[]>("/api/companies");

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    if (!query) return companies.slice(0, 20);
    const lowerQuery = query.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(lowerQuery)).slice(0, 20);
  }, [companies, query]);

  const selectedCompany = useMemo(() => {
    if (!value || !companies) return null;
    return companies.find((c) => c.id === value) ?? null;
  }, [companies, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", value && "border-primary/50 bg-primary/5")}
        >
          {selectedCompany ? selectedCompany.name : "Organisasjon"}
          {value && (
            <ClearFilterButton onClear={() => { onChange(undefined); setOpen(false); }} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Søk organisasjon..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Ingen treff</CommandEmpty>
            <CommandGroup>
              {filteredCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => {
                    onChange(company.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {company.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ContactFilter({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: contacts } = useSWR<ContactData[]>("/api/contacts");

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!query) return contacts.slice(0, 20);
    const lowerQuery = query.toLowerCase();
    return contacts
      .filter(
        (c) =>
          c.firstName.toLowerCase().includes(lowerQuery) ||
          c.lastName.toLowerCase().includes(lowerQuery) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20);
  }, [contacts, query]);

  const selectedContact = useMemo(() => {
    if (!value || !contacts) return null;
    return contacts.find((c) => c.id === value) ?? null;
  }, [contacts, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", value && "border-primary/50 bg-primary/5")}
        >
          {selectedContact
            ? `${selectedContact.firstName} ${selectedContact.lastName}`
            : "Kontakt"}
          {value && (
            <ClearFilterButton onClear={() => { onChange(undefined); setOpen(false); }} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Søk kontakt..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Ingen treff</CommandEmpty>
            <CommandGroup>
              {filteredContacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.firstName} ${contact.lastName}`}
                  onSelect={() => {
                    onChange(contact.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {contact.firstName} {contact.lastName}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === contact.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
