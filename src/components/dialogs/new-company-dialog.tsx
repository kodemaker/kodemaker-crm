"use client";
import { useSWRConfig } from "swr";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const companySchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  websiteUrl: z.url({ error: "Ugyldig URL" }).optional().or(z.literal("")),
  emailDomain: z.string().optional(),
  description: z.string().optional(),
});

export interface NewCompanyDialogProps {
  onCreated?: () => void;
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCompanyDialog({
  onCreated,
  trigger,
  open,
  onOpenChange,
}: NewCompanyDialogProps) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      websiteUrl: "",
      emailDomain: "",
      description: "",
    },
  });

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  // Reset form when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      form.reset();
    }
  }, [dialogOpen, form]);

  function handleOpenChange(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  async function onSubmit(values: z.infer<typeof companySchema>) {
    const res = await fetch("/api/companies", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Kunne ikke opprette organisasjon");
      return;
    }
    toast.success("Organisasjon opprettet");
    form.reset();
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/companies'));
    handleOpenChange(false);
    onCreated?.();
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>{trigger ?? <Button>Ny organisasjon</Button>}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny organisasjon</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Firmanavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webadresse</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post-domene</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beskrivelse..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
