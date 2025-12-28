"use client";
import useSWR, { useSWRConfig } from "swr";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Info, Plus, Save } from "lucide-react";
import { ClearFilterButton } from "@/components/filters/clear-filter-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { LeadStatusSelect } from "@/components/lead-status-select";
import { cn, formatNumberWithSeparators, parseFormattedNumber } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QuickCompanyDialog } from "@/components/dialogs/quick-company-dialog";
import { QuickContactDialog } from "@/components/dialogs/quick-contact-dialog";

type Company = { id: number; name: string };
type Contact = { id: number; firstName: string; lastName: string };

export interface NewLeadDialogProps {
  companyId?: number;
  companyName?: string;
  contactId?: number;
  contactName?: string;
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewLeadDialog({
  companyId,
  companyName,
  contactId,
  contactName,
  trigger,
  open,
  onOpenChange,
  onCreated,
}: NewLeadDialogProps) {
  const schema = z
    .object({
      description: z.string().min(1, "Beskrivelse er pakrevd"),
      status: z.enum(["NEW", "IN_PROGRESS", "ON_HOLD", "LOST", "WON", "BORTFALT"]),
      potentialValue: z.number().int().nullable().optional(),
      companyId: z.number().optional(),
      contactId: z.number().optional(),
    })
    .refine((d) => !!(d.companyId || d.contactId), {
      message: "Velg organisasjon eller kontakt",
      path: ["companyId"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", status: "NEW", potentialValue: null, companyId },
  });

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  const [cOpen, setCOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);

  const [kOpen, setKOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [createContactDialogOpen, setCreateContactDialogOpen] = useState(false);

  const { data: allCompanies } = useSWR<Company[]>(cOpen ? "/api/companies" : null);

  const contactApiUrl = kOpen
    ? selectedCompany?.id
      ? `/api/contacts?companyId=${selectedCompany.id}`
      : "/api/contacts"
    : null;
  const { data: allContacts } = useSWR<Contact[]>(contactApiUrl);

  const { data: selectedContactDetails } = useSWR<{
    currentCompany: { id: number; name: string } | null;
  }>(selectedContact?.id ? `/api/contacts/${selectedContact.id}` : null);

  const { mutate: globalMutate } = useSWRConfig();

  const filteredCompanies = useMemo(() => {
    if (!allCompanies) return [];
    if (!companyQuery.trim()) return allCompanies;
    const lowerQuery = companyQuery.toLowerCase();
    return allCompanies.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  }, [allCompanies, companyQuery]);

  const filteredContacts = useMemo(() => {
    if (!allContacts) return [];
    if (!contactQuery.trim()) return allContacts;
    const lowerQuery = contactQuery.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(lowerQuery) ||
        c.lastName.toLowerCase().includes(lowerQuery) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerQuery)
    );
  }, [allContacts, contactQuery]);

  useEffect(() => {
    if (dialogOpen) {
      form.reset();
      setCompanyQuery("");
      setContactQuery("");

      if (companyId) {
        form.setValue("companyId", companyId);
        setSelectedCompany({ id: companyId, name: companyName || "" });
      } else {
        setSelectedCompany(null);
      }

      if (contactId) {
        form.setValue("contactId", contactId);
        setSelectedContact({
          id: contactId,
          firstName: contactName?.split(" ")?.[0] || "",
          lastName: contactName?.split(" ").slice(1).join(" ") || "",
        });
      } else {
        setSelectedContact(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, companyId, companyName, contactId, contactName]);

  useEffect(() => {
    const cc = selectedContactDetails?.currentCompany;
    if (cc && !companyId) {
      form.setValue("companyId", cc.id);
      setSelectedCompany({ id: cc.id, name: cc.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactDetails]);

  function handleOpenChange(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  function handleCompanyCreated(newCompany: { id: number; name: string }) {
    setSelectedCompany(newCompany);
    form.setValue("companyId", newCompany.id);
    setCreateCompanyDialogOpen(false);
    setCOpen(false);
    setCompanyQuery("");
  }

  function handleContactCreated(newContact: { id: number; firstName: string; lastName: string }) {
    setSelectedContact(newContact);
    form.setValue("contactId", newContact.id);
    setCreateContactDialogOpen(false);
    setKOpen(false);
    setContactQuery("");
  }

  function handleClearContact() {
    setSelectedContact(null);
    form.setValue("contactId", undefined);
    if (!companyId) {
      setSelectedCompany(null);
      form.setValue("companyId", undefined);
    }
  }

  function handleClearCompany() {
    if (!companyId) {
      setSelectedCompany(null);
      form.setValue("companyId", undefined);
    }
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error("Kunne ikke opprette lead");

    if (selectedContact && !selectedContactDetails?.currentCompany && selectedCompany) {
      await fetch("/api/contact-company-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact.id,
          companyId: selectedCompany.id,
          startDate: new Date().toISOString().slice(0, 10),
        }),
      });
    }

    toast.success("Lead opprettet");
    form.reset();

    const refreshCompanyId = selectedCompany?.id ?? companyId;
    const refreshContactId = selectedContact?.id ?? contactId;
    await Promise.all([
      globalMutate("/api/companies"),
      globalMutate("/api/leads"),
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/contacts")),
      refreshCompanyId ? globalMutate(`/api/companies/${refreshCompanyId}`) : Promise.resolve(),
      refreshContactId ? globalMutate(`/api/contacts/${refreshContactId}`) : Promise.resolve(),
    ]);

    onCreated?.();
    handleOpenChange(false);
  }

  const isCompanyDisabled = !!companyId || !!selectedContactDetails?.currentCompany;
  const isContactDisabled = !!contactId;
  const companyDisabledReason = selectedContactDetails?.currentCompany
    ? "Organisasjon settes fra kontaktens nåværende selskap"
    : companyId
      ? "Organisasjon er forhåndsvalgt"
      : null;
  const contactDisabledReason = contactId ? "Kontakt er forhåndsvalgt" : null;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="secondary">Ny lead</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ny lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      className="resize-none max-h-[40vh] overflow-auto"
                      placeholder="Kort beskrivelse"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <LeadStatusSelect value={field.value} onValueChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="potentialValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mulig verdi (NOK)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="f.eks. 500 000"
                        value={formatNumberWithSeparators(field.value)}
                        onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              <FormField
                control={form.control}
                name="contactId"
                render={() => (
                  <FormItem>
                    <FormLabel className="inline-flex items-center gap-1">
                      Kontakt
                      {contactDisabledReason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {contactDisabledReason}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </FormLabel>
                    <Popover open={kOpen} onOpenChange={setKOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={kOpen}
                          disabled={isContactDisabled}
                          className="justify-between w-full"
                          onKeyDown={(e) => {
                            if (kOpen || isContactDisabled) return;
                            if (e.metaKey || e.ctrlKey || e.altKey) return;
                            if (e.key.length === 1) {
                              setKOpen(true);
                              setContactQuery(e.key);
                            } else if (e.key === "Backspace" || e.key === "Delete") {
                              setKOpen(true);
                              setContactQuery("");
                            }
                          }}
                        >
                          <span className="truncate flex-1 min-w-0 text-left">
                            {selectedContact
                              ? `${selectedContact.firstName} ${selectedContact.lastName}`
                              : "Velg kontakt"}
                          </span>
                          {selectedContact && !isContactDisabled ? (
                            <ClearFilterButton onClear={handleClearContact} />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                        <Command>
                          <CommandInput
                            autoFocus
                            placeholder="Sok kontakt..."
                            value={contactQuery}
                            onValueChange={setContactQuery}
                            onKeyDown={(e) => {
                              if (e.key === "Escape" || e.key === "Tab") {
                                setKOpen(false);
                              }
                            }}
                          />
                          <CommandList>
                            {allContacts && allContacts.length > 0 && (
                              <CommandEmpty>Ingen treff</CommandEmpty>
                            )}
                            <CommandGroup>
                              <CommandItem
                                value="__create_new_contact__"
                                onSelect={() => setCreateContactDialogOpen(true)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Lag ny
                              </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Kontakter">
                              {allContacts && allContacts.length === 0 ? (
                                <div className="py-2 px-2 text-sm text-muted-foreground">
                                  Ingen laget enda
                                </div>
                              ) : (
                                filteredContacts.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={`${p.firstName} ${p.lastName}`}
                                    onSelect={() => {
                                      setSelectedContact(p);
                                      form.setValue("contactId", p.id);
                                      setKOpen(false);
                                      setContactQuery("");
                                    }}
                                  >
                                    {p.firstName} {p.lastName}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedContact?.id === p.id ? "opacity-100" : "opacity-0"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <QuickContactDialog
                open={createContactDialogOpen}
                onOpenChange={setCreateContactDialogOpen}
                onCreated={handleContactCreated}
                companyId={selectedCompany?.id}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={() => (
                  <FormItem>
                    <FormLabel className="inline-flex items-center gap-1">
                      Organisasjon
                      {companyDisabledReason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {companyDisabledReason}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </FormLabel>
                    <Popover open={cOpen} onOpenChange={setCOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={cOpen}
                          disabled={isCompanyDisabled}
                          className="justify-between w-full"
                          onKeyDown={(e) => {
                            if (cOpen || isCompanyDisabled) return;
                            if (e.metaKey || e.ctrlKey || e.altKey) return;
                            if (e.key.length === 1) {
                              setCOpen(true);
                              setCompanyQuery(e.key);
                            } else if (e.key === "Backspace" || e.key === "Delete") {
                              setCOpen(true);
                              setCompanyQuery("");
                            }
                          }}
                        >
                          <span className="truncate flex-1 min-w-0 text-left">
                            {selectedCompany?.name || "Velg organisasjon"}
                          </span>
                          {selectedCompany && !isCompanyDisabled ? (
                            <ClearFilterButton onClear={handleClearCompany} />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                        <Command>
                          <CommandInput
                            autoFocus
                            placeholder="Sok organisasjon..."
                            value={companyQuery}
                            onValueChange={setCompanyQuery}
                            onKeyDown={(e) => {
                              if (e.key === "Escape" || e.key === "Tab") {
                                setCOpen(false);
                              }
                            }}
                          />
                          <CommandList>
                            {allCompanies && allCompanies.length > 0 && (
                              <CommandEmpty>Ingen treff</CommandEmpty>
                            )}
                            <CommandGroup>
                              <CommandItem
                                value="__create_new_company__"
                                onSelect={() => setCreateCompanyDialogOpen(true)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Lag ny
                              </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Organisasjoner">
                              {allCompanies && allCompanies.length === 0 ? (
                                <div className="py-2 px-2 text-sm text-muted-foreground">
                                  Ingen laget enda
                                </div>
                              ) : (
                                filteredCompanies.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.name}
                                    onSelect={() => {
                                      setSelectedCompany(c);
                                      form.setValue("companyId", c.id);
                                      setCOpen(false);
                                      setCompanyQuery("");
                                    }}
                                  >
                                    {c.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedCompany?.id === c.id ? "opacity-100" : "opacity-0"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <QuickCompanyDialog
                open={createCompanyDialogOpen}
                onOpenChange={setCreateCompanyDialogOpen}
                onCreated={handleCompanyCreated}
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit" className="inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Lagre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
