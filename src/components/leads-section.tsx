import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { ApiLead } from "@/types/api";

type LeadsSectionProps = {
  leads: ApiLead[];
  title?: string;
  headerAction?: React.ReactNode;
};

const statusBadgeConfig: Record<
  ApiLead["status"],
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  NEW: { label: "Ny", variant: "default" },
  IN_PROGRESS: { label: "Under arbeid", variant: "tertiary" },
  WON: { label: "Vunnet", variant: "primary" },
  LOST: { label: "Tapt", variant: "destructive" },
  BORTFALT: { label: "Bortfalt", variant: "bortfalt" },
};

export function LeadsSection({ leads, title = "Leads", headerAction }: LeadsSectionProps) {
  const stats = useMemo(() => {
    const counts = {
      NEW: 0,
      IN_PROGRESS: 0,
      WON: 0,
      LOST: 0,
      BORTFALT: 0,
    };
    for (const lead of leads) {
      const status = lead.status as keyof typeof counts;
      if (status in counts) {
        counts[status] = (counts[status] || 0) + 1;
      }
    }
    return counts;
  }, [leads]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium break-words min-w-0 flex-1">{title}</h2>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {leads.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Ny: {stats.NEW}</span>
          <span>Under arbeid: {stats.IN_PROGRESS}</span>
          <span>Vunnet: {stats.WON}</span>
          <span>Tapt: {stats.LOST}</span>
          <span>Bortfalt: {stats.BORTFALT}</span>
        </div>
      )}
      <div className="divide-y rounded border">
        {leads.length ? (
          leads.map((l) => (
            <a key={l.id} href={`/leads/${l.id}`} className="block p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {l.description.length > 100 ? `${l.description.slice(0, 100)}…` : l.description}
                </div>
                <Badge variant={statusBadgeConfig[l.status]?.variant}>
                  {statusBadgeConfig[l.status]?.label ?? l.status}
                </Badge>
              </div>
            </a>
          ))
        ) : (
          <div className="p-3 text-sm text-muted-foreground">Ingen</div>
        )}
      </div>
    </section>
  );
}
