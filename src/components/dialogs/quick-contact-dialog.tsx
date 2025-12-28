"use client";

import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const quickContactSchema = z.object({
  firstName: z.string().min(1, "Fornavn er pakrevd"),
  lastName: z.string().min(1, "Etternavn er pakrevd"),
});

export interface QuickContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (contact: { id: number; firstName: string; lastName: string }) => void;
  /** If provided, the contact will be linked to this company */
  companyId?: number;
}

/**
 * Minimal contact creation dialog for inline creation flow.
 * Only requires firstName and lastName - other details can be added later.
 * If companyId is provided, the contact is automatically linked to that company.
 */
export function QuickContactDialog({
  open,
  onOpenChange,
  onCreated,
  companyId,
}: QuickContactDialogProps) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.infer<typeof quickContactSchema>>({
    resolver: zodResolver(quickContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
  }

  async function onSubmit(values: z.infer<typeof quickContactSchema>) {
    const payload = {
      ...values,
      ...(companyId && { companyId }),
    };

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Kunne ikke opprette kontakt");
      return;
    }

    const created = await res.json();
    toast.success("Kontakt opprettet");
    form.reset();

    // Invalidate contacts cache
    await mutate((key) => typeof key === "string" && key.startsWith("/api/contacts"));

    // Also invalidate company cache if we linked to a company
    if (companyId) {
      await mutate(`/api/companies/${companyId}`);
    }

    onCreated({
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[400px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Ny kontakt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
              onSubmit={(e) => {
                e.stopPropagation();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornavn</FormLabel>
                    <FormControl>
                      <Input placeholder="Fornavn" autoFocus {...field} />
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
                      <Input placeholder="Etternavn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Opprett
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
