"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Banknote, Building2, Trophy, XCircle, MinusCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { KanbanLead } from "./kanban-lead-card";

type KanbanFinishedZoneProps = {
  wonLeads: KanbanLead[];
  lostLeads: KanbanLead[];
  bortfaltLeads: KanbanLead[];
  isDragging: boolean;
};

// Style constants extracted outside component to avoid recreation on each render
const VARIANT_STYLES = {
  won: "bg-primary/10 border-primary/30",
  lost: "bg-destructive/10 border-destructive/30",
  bortfalt: "bg-muted border-muted-foreground/30",
} as const;

const ICON_STYLES = {
  won: "text-primary",
  lost: "text-destructive",
  bortfalt: "text-muted-foreground",
} as const;

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mill`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} K`;
  }
  return value.toLocaleString("nb-NO");
}

function sumPotentialValue(leads: KanbanLead[]): number {
  return leads.reduce((sum, lead) => sum + (lead.potentialValue ?? 0), 0);
}

function FinishedDropZone({
  id,
  title,
  icon: Icon,
  variant,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  variant: "won" | "lost" | "bortfalt";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={id}
      className={cn(
        "flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all",
        VARIANT_STYLES[variant],
        isOver && variant === "won" && "bg-primary/30 border-primary scale-105",
        isOver && variant === "lost" && "bg-destructive/30 border-destructive scale-105",
        isOver && variant === "bortfalt" && "bg-accent/50 border-accent scale-105"
      )}
    >
      <Icon className={cn("h-8 w-8 mb-2", ICON_STYLES[variant])} />
      <span className="font-medium text-sm">{title}</span>
    </div>
  );
}

function FinishedLeadCard({
  lead,
  icon: Icon,
  iconClass,
}: {
  lead: KanbanLead;
  icon: React.ElementType;
  iconClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative block p-3 rounded-lg border bg-card cursor-grab hover:border-primary/50 active:border-primary/70 transition-colors touch-none",
        isDragging && "opacity-50"
      )}
      {...listeners}
      {...attributes}
      aria-label={`Lead: ${lead.description.slice(0, 50)}${lead.description.length > 50 ? "…" : ""}`}
      aria-roledescription="draggable lead card"
    >
      <Icon className={cn("absolute top-3 right-3 h-4 w-4", iconClass)} />
      <Link
        href={`/leads/${lead.id}`}
        className="block min-w-0 pr-5"
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        <div className="space-y-2">
          {lead.company && (
            <Badge variant="default" className="text-xs inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {lead.company.name}
            </Badge>
          )}
          <p className="text-sm line-clamp-2">{lead.description}</p>
          {lead.potentialValue != null && lead.potentialValue > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <span>{formatShortCurrency(lead.potentialValue)}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export function KanbanFinishedZone({
  wonLeads,
  lostLeads,
  bortfaltLeads,
  isDragging,
}: KanbanFinishedZoneProps) {
  const totalFinished = wonLeads.length + lostLeads.length + bortfaltLeads.length;

  // When dragging - show stacked drop zones full height
  if (isDragging) {
    return (
      <div className="flex flex-col bg-muted/50 rounded-lg min-w-[180px] flex-1 h-full">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Ferdig</h3>
          <Badge variant="default" className="text-xs">
            {totalFinished}
          </Badge>
        </div>
        <div className="flex-1 p-3 flex flex-col gap-3">
          <FinishedDropZone
            id="status-WON"
            title="Vunnet"
            icon={Trophy}
            variant="won"
          />
          <FinishedDropZone
            id="status-LOST"
            title="Tapt"
            icon={XCircle}
            variant="lost"
          />
          <FinishedDropZone
            id="status-BORTFALT"
            title="Bortfalt"
            icon={MinusCircle}
            variant="bortfalt"
          />
        </div>
      </div>
    );
  }

  // Normal state - show finished leads with icons
  return (
    <div className="flex flex-col bg-muted/50 rounded-lg min-w-[180px] flex-1 h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Ferdig</h3>
        <Badge variant="default" className="text-xs">
          {totalFinished}
        </Badge>
      </div>
      {/* Stats section - always visible at top */}
      <div className="p-2 border-b bg-muted/30 space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span>
            Vunnet: {wonLeads.length}
            {sumPotentialValue(wonLeads) > 0 && (
              <span className="ml-1">
                ({formatShortCurrency(sumPotentialValue(wonLeads))})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>
            Tapt: {lostLeads.length}
            {sumPotentialValue(lostLeads) > 0 && (
              <span className="ml-1">
                ({formatShortCurrency(sumPotentialValue(lostLeads))})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MinusCircle className="h-4 w-4 text-muted-foreground" />
          <span>
            Bortfalt: {bortfaltLeads.length}
            {sumPotentialValue(bortfaltLeads) > 0 && (
              <span className="ml-1">
                ({formatShortCurrency(sumPotentialValue(bortfaltLeads))})
              </span>
            )}
          </span>
        </div>
      </div>
      {/* Scrollable leads list */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {/* Won leads */}
        {wonLeads.map((lead) => (
          <FinishedLeadCard
            key={lead.id}
            lead={lead}
            icon={Trophy}
            iconClass="text-primary"
          />
        ))}
        {/* Lost leads */}
        {lostLeads.map((lead) => (
          <FinishedLeadCard
            key={lead.id}
            lead={lead}
            icon={XCircle}
            iconClass="text-destructive"
          />
        ))}
        {/* Bortfalt leads */}
        {bortfaltLeads.map((lead) => (
          <FinishedLeadCard
            key={lead.id}
            lead={lead}
            icon={MinusCircle}
            iconClass="text-muted-foreground"
          />
        ))}
        {totalFinished === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-6 px-4">
            <div className="bg-muted/50 rounded-full p-3 mb-3">
              <CheckCircle2 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Dra lead hit når den er vunnet, tapt, eller bortfalt
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
