"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Banknote, Building2, CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency, formatDateShort, getInitials, useDueBgStyle } from "@/lib/utils";
import type { LeadStatus } from "@/types/api";

export type KanbanLead = {
  id: number;
  description: string;
  status: LeadStatus;
  potentialValue?: number | null;
  company: { id: number; name: string } | null;
  contact: { id: number; firstName: string; lastName: string } | null;
  nextFollowup?: { dueAt: string; assignedTo?: { firstName: string; lastName: string } | null } | null;
};

type KanbanLeadCardProps = {
  lead: KanbanLead;
  isDragOverlay?: boolean;
};

export function KanbanLeadCard({ lead, isDragOverlay = false }: KanbanLeadCardProps) {
  const dueBgStyle = useDueBgStyle();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const cardContent = (
    <div className="space-y-2">
      {/* Company badge at top */}
      {lead.company && (
        <Badge variant="default" className="text-xs inline-flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          {lead.company.name}
        </Badge>
      )}

      {/* Description */}
      <p className="text-sm line-clamp-2">{lead.description}</p>

      {/* Potential value */}
      {lead.potentialValue && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Banknote className="h-4 w-4" />
          <span>{formatCurrency(lead.potentialValue)}</span>
        </div>
      )}

      {/* Divider and followup info */}
      {lead.nextFollowup && (
        <>
          <div className="border-t" />
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground rounded px-1 -ml-1"
              style={dueBgStyle(lead.nextFollowup.dueAt)}
            >
              <CalendarCheck2 className="h-4 w-4" />
              <span>{formatDateShort(lead.nextFollowup.dueAt)}</span>
            </div>
            {lead.nextFollowup.assignedTo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(
                        lead.nextFollowup.assignedTo.firstName,
                        lead.nextFollowup.assignedTo.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {lead.nextFollowup.assignedTo.firstName} {lead.nextFollowup.assignedTo.lastName}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Drag overlay version - no interactivity
  if (isDragOverlay) {
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg cursor-grabbing w-[230px]">
        {cardContent}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab hover:border-primary/50 active:border-primary/70 transition-colors touch-none",
        isDragging && "opacity-50"
      )}
      {...listeners}
      {...attributes}
      aria-label={`Lead: ${lead.description.slice(0, 50)}${lead.description.length > 50 ? "…" : ""}`}
      aria-roledescription="draggable lead card"
    >
      <Link
        href={`/leads/${lead.id}`}
        className="block"
        onClick={(e) => {
          // Allow link click but not during drag
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        {cardContent}
      </Link>
    </div>
  );
}
