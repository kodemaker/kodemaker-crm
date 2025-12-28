"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KanbanLeadCard, type KanbanLead } from "./kanban-lead-card";
import { Inbox } from "lucide-react";

type KanbanColumnProps = {
  id: string;
  title: string;
  leads: KanbanLead[];
  className?: string;
};

export function KanbanColumn({ id, title, leads, className }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/50 rounded-lg min-w-[180px] flex-1 h-full",
        className
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="default" className="text-xs">
          {leads.length}
        </Badge>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 overflow-y-auto transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {leads.map((lead) => (
          <KanbanLeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            <div className="bg-muted/50 rounded-full p-3 mb-3">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Opprett lead eller dra hit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
