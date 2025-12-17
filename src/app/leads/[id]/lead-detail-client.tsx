"use client";

import useSWR, { useSWRConfig } from "swr";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { useRouter, useParams } from "next/navigation";
import { CreatedBy } from "@/components/created-by";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { LeadHeader } from "@/components/entity-summary-header";
import { LeadStatusSelect, type LeadStatus } from "@/components/lead-status-select";
import { ActivityLog } from "@/components/activity-log";
import { formatNumberWithSeparators, parseFormattedNumber } from "@/lib/utils";

const schema = z.object({
  description: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "ON_HOLD", "LOST", "WON", "BORTFALT"]),
  potentialValue: z.number().int().nullable().optional(),
});

type LeadData = {
  id: number;
  description: string;
  status: LeadStatus;
  potentialValue?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string; lastName: string } | null;
};

export function LeadDetailClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data } = useSWR<LeadData>(id ? `/api/leads/${id}` : null);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  if (!data) {
    return <div className="flex items-center justify-center h-64">Laster...</div>;
  }

  return <LeadForm data={data} id={id} mutate={mutate} router={router} />;
}

function LeadForm({
  data,
  id,
  mutate,
  router,
}: {
  data: LeadData;
  id: number;
  mutate: ReturnType<typeof useSWRConfig>["mutate"];
  router: ReturnType<typeof useRouter>;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: data.description,
      status: data.status,
      potentialValue: data.potentialValue ?? null,
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error("Kunne ikke oppdatere lead");
    toast.success("Lead oppdatert");
    await mutate(`/api/leads/${id}`);
    const target = data.contact
      ? `/contacts/${data.contact.id}`
      : data.company
        ? `/customers/${data.company.id}`
        : "/customers";
    router.push(target);
  }

  const crumbs = [
    { label: "Organisasjoner", href: "/customers" },
    ...(data.company
      ? [{ label: data.company.name, href: `/customers/${data.company.id}` }]
      : []),
    ...(data.contact
      ? [
          {
            label: `${data.contact.firstName} ${data.contact.lastName}`,
            href: `/contacts/${data.contact.id}`,
          },
        ]
      : []),
    { label: "Lead" },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs items={crumbs} />
      <LeadHeader
        company={data.company ?? null}
        contact={data.contact ?? null}
      />

      <section className="bg-muted rounded-lg p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea rows={5} className="resize-y bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <LeadStatusSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="bg-background"
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
                        className="bg-background"
                        value={formatNumberWithSeparators(field.value)}
                        onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Lagre
              </Button>
            </div>
          </form>
        </Form>
      </section>

      <ActivityLog
        leadId={data.id}
        contactId={data.contact?.id}
        companyId={data.company?.id}
      />

      <CreatedBy createdAt={data.createdAt} createdBy={data.createdBy} />
    </div>
  );
}
