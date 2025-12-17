"use client";
import useSWR, { useSWRConfig } from "swr";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
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
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { formatNumberWithSeparators, parseFormattedNumber } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
      description: z.string().min(1),
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
  const [kOpen, setKOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { data: companies } = useSWR<Company[]>(
    companyQuery ? `/api/companies?q=${encodeURIComponent(companyQuery)}` : null
  );
  const { data: contacts } = useSWR<Contact[]>(
    contactQuery ? `/api/contacts?q=${encodeURIComponent(contactQuery)}` : null
  );
  const { data: selectedContactDetails } = useSWR<{
    currentCompany: { id: number; name: string } | null;
  }>(selectedContact?.id ? `/api/contacts/${selectedContact.id}` : null);
  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    if (companyId) {
      form.setValue("companyId", companyId);
      setSelectedCompany({ id: companyId, name: companyName || "" });
    } else {
      form.setValue("companyId", undefined);
      setSelectedCompany(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companyName]);

  useEffect(() => {
    if (contactId) {
      form.setValue("contactId", contactId);
      setSelectedContact({
        id: contactId,
        firstName: contactName?.split(" ")?.[0] || "",
        lastName: contactName?.split(" ").slice(1).join(" ") || "",
      });
    } else {
      form.setValue("contactId", undefined);
      setSelectedContact(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, contactName]);

  // If a selected contact has a current company, auto-fill the company field
  useEffect(() => {
    const cc = selectedContactDetails?.currentCompany;
    if (cc) {
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

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch("/api/leads", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error("Kunne ikke opprette lead");
    toast.success("Lead opprettet");
    // Refresh relevant lists so the new lead appears immediately
    const refreshCompanyId = selectedCompany?.id ?? companyId;
    const refreshContactId = selectedContact?.id ?? contactId;
    await Promise.all([
      globalMutate("/api/companies"),
      globalMutate("/api/leads"),
      refreshCompanyId ? globalMutate(`/api/companies/${refreshCompanyId}`) : Promise.resolve(),
      refreshContactId ? globalMutate(`/api/contacts/${refreshContactId}`) : Promise.resolve(),
    ]);
    onCreated?.();
    handleOpenChange(false);
  }
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <LeadStatusSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    />
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contactId"
                render={() => (
                  <FormItem>
                    <FormLabel>Kontakt</FormLabel>
                    <Popover open={kOpen} onOpenChange={setKOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-between w-full"
                          onKeyDown={(e) => {
                            if (kOpen) return;
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
                          {selectedContact
                            ? `${selectedContact.firstName} ${selectedContact.lastName}`
                            : "Velg kontakt"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                        <Command>
                          <CommandInput
                            autoFocus
                            placeholder="Søk kontakt..."
                            value={contactQuery}
                            onValueChange={setContactQuery}
                            onKeyDown={(e) => {
                              if (e.key === "Escape" || e.key === "Tab") {
                                setKOpen(false);
                              }
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>Ingen treff</CommandEmpty>
                            {contacts?.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.firstName} ${p.lastName}`}
                                onSelect={() => {
                                  setSelectedContact(p);
                                  form.setValue("contactId", p.id);
                                  setKOpen(false);
                                }}
                              >
                                {p.firstName} {p.lastName}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={() => (
                  <FormItem>
                    <FormLabel>Organisasjon</FormLabel>
                    <Popover open={cOpen} onOpenChange={setCOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-between w-full"
                          onKeyDown={(e) => {
                            if (cOpen) return;
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
                          {selectedCompany?.name || companyName || "Velg organisasjon"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                        <Command>
                          <CommandInput
                            autoFocus
                            placeholder="Søk organisasjon..."
                            value={companyQuery}
                            onValueChange={setCompanyQuery}
                            onKeyDown={(e) => {
                              if (e.key === "Escape" || e.key === "Tab") {
                                setCOpen(false);
                              }
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>Ingen treff</CommandEmpty>
                            {companies?.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  setSelectedCompany(c);
                                  form.setValue("companyId", c.id);
                                  setCOpen(false);
                                }}
                              >
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
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
