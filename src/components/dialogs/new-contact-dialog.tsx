"use client";
import useSWR, { useSWRConfig } from "swr";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Company = {
  id: number;
  name: string;
  emailDomain?: string | null;
};

export interface NewContactDialogProps {
  companyId?: number;
  companyName?: string;
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewContactDialog({
  companyId,
  companyName,
  trigger,
  open,
  onOpenChange,
}: NewContactDialogProps) {
  const schema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email({ error: "Ugyldig epost" }).optional().or(z.literal("")),
    phone: z.string().optional(),
    linkedInUrl: z.url({ error: "Ugyldig URL" }).optional().or(z.literal("")),
    description: z.string().optional(),
    companyId: z.number().optional(),
    role: z.string().optional(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      description: "",
      companyId,
      role: "",
    },
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{
    id: number;
    name: string;
    emailDomain?: string | null;
  } | null>(null);
  const { data: companyOptions } = useSWR<Company[]>(
    companyQuery ? `/api/companies?q=${encodeURIComponent(companyQuery)}` : null
  );
  const { mutate: globalMutate } = useSWRConfig();
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);

  const firstNameValue = form.watch("firstName");
  const lastNameValue = form.watch("lastName");

  function normalizeNamePart(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function buildEmailSuggestion(
    firstName: string,
    lastName: string,
    domain: string | null | undefined
  ): string | undefined {
    if (!domain) return undefined;
    const cleanDomain = domain.replace(/^@/, "");
    const first = normalizeNamePart(firstName || "");
    const last = normalizeNamePart(lastName || "");
    if (!first && !last) return undefined;
    const local = first && last ? `${first}.${last}` : first || last;
    return `${local}@${cleanDomain}`;
  }

  useEffect(() => {
    if (companyId) {
      setSelectedCompany({ id: companyId, name: companyName || "" });
      form.setValue("companyId", companyId);
    } else {
      setSelectedCompany(null);
      form.setValue("companyId", undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companyName]);

  // Auto-suggest email when company has domain and user hasn't manually edited email
  const domainFromSelection = selectedCompany?.emailDomain;

  useEffect(() => {
    if (!domainFromSelection || emailManuallyEdited) return;
    const suggestion = buildEmailSuggestion(firstNameValue, lastNameValue, domainFromSelection);
    if (suggestion) {
      form.setValue("email", suggestion, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFromSelection, firstNameValue, lastNameValue, emailManuallyEdited]);

  function handleOpenChange(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error("Kunne ikke opprette kontakt");
    toast.success("Kontakt opprettet");
    form.reset();
    const idToRefresh = selectedCompany?.id ?? companyId;
    
    // Refresh both contacts list and company detail (if applicable)
    await Promise.all([
      globalMutate((key) => typeof key === 'string' && key.startsWith('/api/contacts')),
      idToRefresh ? globalMutate(`/api/companies/${idToRefresh}`) : Promise.resolve(),
    ]);
    
    handleOpenChange(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="secondary">Ny kontakt</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny kontakt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornavn</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etternavn</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-between w-full"
                        onKeyDown={(e) => {
                          if (companyOpen) return;
                          if (e.metaKey || e.ctrlKey || e.altKey) return;
                          if (e.key.length === 1) {
                            setCompanyOpen(true);
                            setCompanyQuery(e.key);
                          } else if (e.key === "Backspace" || e.key === "Delete") {
                            setCompanyOpen(true);
                            setCompanyQuery("");
                          }
                        }}
                      >
                        {selectedCompany?.name || "Velg organisasjon"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                      <Command>
                        <CommandInput
                          autoFocus
                          placeholder="Søk etter organisasjon..."
                          value={companyQuery}
                          onValueChange={setCompanyQuery}
                          onKeyDown={(e) => {
                            if (e.key === "Escape" || e.key === "Tab") {
                              setCompanyOpen(false);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>Ingen treff</CommandEmpty>
                          {companyOptions?.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setSelectedCompany({
                                  id: c.id,
                                  name: c.name,
                                  emailDomain: c.emailDomain,
                                });
                                form.setValue("companyId", c.id);
                                // Allow auto-suggestion to apply for newly selected company
                                setEmailManuallyEdited(false);
                                setCompanyOpen(false);
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
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolle</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Epost</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        setEmailManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedInUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beskrivelse..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="col-span-2 flex justify-end mt-6">
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
