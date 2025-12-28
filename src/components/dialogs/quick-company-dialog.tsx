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

const quickCompanySchema = z.object({
  name: z.string().min(1, "Navn er pakrevd"),
});

export interface QuickCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (company: { id: number; name: string }) => void;
}

/**
 * Minimal company creation dialog for inline creation flow.
 * Only requires the name field - other details can be added later.
 */
export function QuickCompanyDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCompanyDialogProps) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.infer<typeof quickCompanySchema>>({
    resolver: zodResolver(quickCompanySchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof quickCompanySchema>) {
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        toast.error("Kunne ikke opprette organisasjon");
        return;
      }

      const created = await res.json();
      toast.success("Organisasjon opprettet");
      form.reset();

      await mutate((key) => typeof key === "string" && key.startsWith("/api/companies"));
      onCreated({ id: created.id, name: created.name });
    } catch {
      toast.error("Nettverksfeil - prøv igjen");
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
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
          <DialogTitle>Ny organisasjon</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
              onSubmit={(e) => {
                e.stopPropagation();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Firmanavn" autoFocus {...field} />
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
