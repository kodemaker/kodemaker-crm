import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Rocket, Target, TrendingUp } from "lucide-react";
import type { ApiLead } from "@/types/api";

type LeadsSectionProps = {
  leads: ApiLead[];
  title?: string;
  headerAction?: React.ReactNode;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
};

const statusBadgeConfig: Record<
  ApiLead["status"],
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  NEW: { label: "Ny", variant: "default" },
  IN_PROGRESS: { label: "Under arbeid", variant: "tertiary" },
  ON_HOLD: { label: "På vent", variant: "secondary" },
  WON: { label: "Vunnet", variant: "primary" },
  LOST: { label: "Tapt", variant: "destructive" },
  BORTFALT: { label: "Bortfalt", variant: "bortfalt" },
};

export function LeadsSection({
  leads,
  title = "Leads",
  headerAction,
  emptyStateAction,
}: LeadsSectionProps) {
  const stats = useMemo(() => {
    const counts = {
      NEW: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
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

  // Empty state - compact horizontal layout, no header
  if (leads.length === 0) {
    return (
      <section>
        <EmptyState
          layout="horizontal"
          icons={[Rocket, Target, TrendingUp]}
          title="Ingen leads enda"
          description="Er det noe du kan gjøre for å endre dette?"
          action={emptyStateAction}
        />
      </section>
    );
  }

  // Has leads - show full section with header
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium break-words min-w-0 flex-1">{title}</h2>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Ny: {stats.NEW}</span>
        <span>Under arbeid: {stats.IN_PROGRESS}</span>
        <span>På vent: {stats.ON_HOLD}</span>
        <span>Vunnet: {stats.WON}</span>
        <span>Tapt: {stats.LOST}</span>
        <span>Bortfalt: {stats.BORTFALT}</span>
      </div>
      <div className="divide-y rounded border">
        {leads.map((l) => (
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
        ))}
      </div>
    </section>
  );
}
