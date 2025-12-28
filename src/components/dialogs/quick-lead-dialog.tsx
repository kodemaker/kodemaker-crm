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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const quickLeadSchema = z.object({
  description: z.string().min(1, "Beskrivelse er pakrevd"),
});

export interface QuickLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: { id: number; description: string }) => void;
  /** Company ID to associate with the lead (required for lead creation) */
  companyId: number;
  /** Optional contact ID to associate with the lead */
  contactId?: number;
}

/**
 * Minimal lead creation dialog for inline creation flow.
 * Only requires the description field - status defaults to "NEW".
 * Company must be provided; contact is optional.
 */
export function QuickLeadDialog({
  open,
  onOpenChange,
  onCreated,
  companyId,
  contactId,
}: QuickLeadDialogProps) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.infer<typeof quickLeadSchema>>({
    resolver: zodResolver(quickLeadSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof quickLeadSchema>) {
    const payload = {
      ...values,
      companyId,
      ...(contactId && { contactId }),
      status: "NEW",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("Kunne ikke opprette lead");
        return;
      }

      const created = await res.json();
      toast.success("Lead opprettet");
      form.reset();

      await mutate((key) => typeof key === "string" && key.startsWith("/api/leads"));
      await mutate(`/api/companies/${companyId}`);
      if (contactId) {
        await mutate(`/api/contacts/${contactId}`);
      }

      onCreated({
        id: created.id,
        description: created.description,
      });
    } catch {
      toast.error("Nettverksfeil - prøv igjen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Ny lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Kort beskrivelse av leadet..."
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
