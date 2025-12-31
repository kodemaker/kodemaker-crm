"use client";
import useSWR, { useSWRConfig } from "swr";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus, Save } from "lucide-react";
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
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { QuickCompanyDialog } from "@/components/dialogs/quick-company-dialog";

type Company = {
  id: number;
  name: string;
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
    firstName: z.string().min(1, "Fornavn er påkrevd"),
    lastName: z.string().min(1, "Etternavn er påkrevd"),
    email: z.email({ error: "Ugyldig e-postadresse" }).optional().or(z.literal("")),
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
  } | null>(null);
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);

  const { data: allCompanies } = useSWR<Company[]>(
    companyOpen ? "/api/companies" : null
  );
  const { mutate: globalMutate } = useSWRConfig();

  const filteredCompanies = useMemo(() => {
    if (!allCompanies) return [];
    if (!companyQuery.trim()) return allCompanies;
    const lowerQuery = companyQuery.toLowerCase();
    return allCompanies.filter((c) =>
      c.name.toLowerCase().includes(lowerQuery)
    );
  }, [allCompanies, companyQuery]);

  useEffect(() => {
    if (dialogOpen) {
      if (companyId) {
        setSelectedCompany({ id: companyId, name: companyName || "" });
        form.setValue("companyId", companyId);
      } else {
        setSelectedCompany(null);
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, companyId, companyName]);

  function handleOpenChange(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  function handleCompanyCreated(newCompany: { id: number; name: string }) {
    setSelectedCompany({ id: newCompany.id, name: newCompany.name });
    form.setValue("companyId", newCompany.id);
    setCreateCompanyDialogOpen(false);
    setCompanyOpen(false);
    setCompanyQuery("");
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
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
                  <Popover
                    open={companyOpen}
                    onOpenChange={(open) => {
                      setCompanyOpen(open);
                      if (!open) setCompanyQuery("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={companyOpen}
                        disabled={!!companyId}
                        className="justify-between w-full"
                        onKeyDown={(e) => {
                          if (companyOpen || !!companyId) return;
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
                        <span className="truncate flex-1 min-w-0 text-left">
                          {selectedCompany?.name || "Velg organisasjon"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                              setCompanyOpen(false);
                            }
                          }}
                        />
                        <CommandList>
                          {allCompanies && allCompanies.length > 0 && (
                            <CommandEmpty>Ingen treff</CommandEmpty>
                          )}
                          <CommandGroup>
                            <CommandItem
                              value="__create_new__"
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
                                    setSelectedCompany({
                                      id: c.id,
                                      name: c.name,
                                    });
                                    form.setValue("companyId", c.id);
                                    setCompanyOpen(false);
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
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => {
                const isRoleDisabled = !selectedCompany;
                return (
                  <FormItem>
                    <FormLabel>Rolle</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isRoleDisabled}
                            placeholder={isRoleDisabled ? "Velg organisasjon først" : ""}
                            className={cn(isRoleDisabled && "cursor-not-allowed")}
                          />
                        </FormControl>
                      </TooltipTrigger>
                      {isRoleDisabled && (
                        <TooltipContent side="top">
                          Velg organisasjon først
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Epost</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                <FormItem className="sm:col-span-2">
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beskrivelse..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2 flex justify-end mt-6">
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
