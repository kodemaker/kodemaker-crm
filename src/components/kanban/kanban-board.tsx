"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import useSWR, { useSWRConfig } from "swr";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { NewLeadDialog } from "@/components/dialogs/new-lead-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KanbanColumn } from "./kanban-column";
import { KanbanFinishedZone } from "./kanban-finished-zone";
import { KanbanLeadCard, type KanbanLead } from "./kanban-lead-card";
import type { LeadStatus } from "@/types/api";

type ApiLead = {
  id: number;
  description: string;
  status: LeadStatus;
  potentialValue?: number | null;
  createdAt: string;
  company: { id: number; name: string } | null;
  contact: { id: number; firstName: string; lastName: string } | null;
  nextFollowup?: {
    dueAt: string;
    assignedTo: { firstName: string; lastName: string } | null;
  } | null;
};

// Columns for active leads
const ACTIVE_COLUMNS: { id: string; title: string; status: LeadStatus }[] = [
  { id: "status-NEW", title: "Ny", status: "NEW" },
  { id: "status-IN_PROGRESS", title: "Under arbeid", status: "IN_PROGRESS" },
  { id: "status-ON_HOLD", title: "Satt på vent", status: "ON_HOLD" },
];

function getStatusFromDroppableId(id: string): LeadStatus | null {
  const statusMap: Record<string, LeadStatus> = {
    "status-NEW": "NEW",
    "status-IN_PROGRESS": "IN_PROGRESS",
    "status-ON_HOLD": "ON_HOLD",
    "status-WON": "WON",
    "status-LOST": "LOST",
    "status-BORTFALT": "BORTFALT",
  };
  return statusMap[id] ?? null;
}

export function KanbanBoard() {
  const { mutate } = useSWRConfig();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newLeadDialogOpen, setNewLeadDialogOpen] = useState(false);

  // Fetch all leads (active + finished for the finished zone counts)
  const { data: leads = [], isLoading } = useSWR<ApiLead[]>("/api/leads");

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, KanbanLead[]> = {
      NEW: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      WON: [],
      LOST: [],
      BORTFALT: [],
    };

    for (const lead of leads) {
      grouped[lead.status].push({
        id: lead.id,
        description: lead.description,
        status: lead.status,
        potentialValue: lead.potentialValue,
        company: lead.company,
        contact: lead.contact,
        nextFollowup: lead.nextFollowup ?? null,
      });
    }

    return grouped;
  }, [leads]);

  // Find active lead for drag overlay
  const activeLead = useMemo(() => {
    if (!activeId) return null;
    const leadId = parseInt(activeId.replace("lead-", ""), 10);
    return leads.find((l) => l.id === leadId) ?? null;
  }, [activeId, leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const newStatus = getStatusFromDroppableId(over.id as string);
    if (!newStatus) return;

    const leadId = parseInt((active.id as string).replace("lead-", ""), 10);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Trigger confetti for won leads
    if (newStatus === "WON") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Optimistic update
    mutate(
      "/api/leads",
      leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      false
    );

    // Update on server
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        mutate("/api/leads");
        toast.error("Kunne ikke oppdatere lead status");
      }
    } catch {
      // Revert on error
      mutate("/api/leads");
      toast.error("Kunne ikke oppdatere lead status");
    }
  };

  const handleLeadCreated = () => {
    mutate("/api/leads");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster leads...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header with title and Ny Lead button */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setNewLeadDialogOpen(true)}
              size="icon"
              className="rounded-full h-9 w-9"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ny Lead</TooltipContent>
        </Tooltip>
      </div>

      {/* Kanban board - horizontal scroll on mobile */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 h-full">
            {/* Active columns */}
            {ACTIVE_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                leads={leadsByStatus[column.status]}
              />
            ))}

            {/* Finished zone */}
            <KanbanFinishedZone
              wonLeads={leadsByStatus.WON}
              lostLeads={leadsByStatus.LOST}
              bortfaltLeads={leadsByStatus.BORTFALT}
              isDragging={!!activeId}
            />
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeLead && (
            <KanbanLeadCard
              lead={{
                id: activeLead.id,
                description: activeLead.description,
                status: activeLead.status,
                potentialValue: activeLead.potentialValue,
                company: activeLead.company,
                contact: activeLead.contact,
                nextFollowup: null,
              }}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* New Lead Dialog */}
      <NewLeadDialog
        trigger={null}
        open={newLeadDialogOpen}
        onOpenChange={setNewLeadDialogOpen}
        onCreated={handleLeadCreated}
      />
    </div>
  );
}
