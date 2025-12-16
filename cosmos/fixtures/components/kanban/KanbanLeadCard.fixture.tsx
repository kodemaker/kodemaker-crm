import React from "react";
import { DndContext } from "@dnd-kit/core";
import { KanbanLeadCard, type KanbanLead } from "@/components/kanban/kanban-lead-card";

const mockLeadFull: KanbanLead = {
  id: 1,
  description: "Interessert i nytt prosjekt for å modernisere deres IT-infrastruktur",
  status: "IN_PROGRESS",
  potentialValue: 500000,
  company: { id: 1, name: "Acme Corp" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
  nextFollowup: {
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: { firstName: "Kari", lastName: "Hansen" },
  },
};

const mockLeadMinimal: KanbanLead = {
  id: 2,
  description: "Enkel lead uten ekstra info",
  status: "NEW",
  company: null,
  contact: null,
};

const mockLeadOverdue: KanbanLead = {
  id: 3,
  description: "Lead med forfalt oppfølging",
  status: "ON_HOLD",
  potentialValue: 250000,
  company: { id: 2, name: "Tech Solutions AS" },
  contact: null,
  nextFollowup: {
    dueAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: null,
  },
};

const mockLeadLongDescription: KanbanLead = {
  id: 4,
  description:
    "Dette er en veldig lang beskrivelse som går over flere linjer for å teste hvordan kortet håndterer lange tekster med line-clamp og ellipsis",
  status: "NEW",
  potentialValue: 1500000,
  company: { id: 3, name: "Innovasjonsselskapet" },
  contact: { id: 2, firstName: "Per", lastName: "Pedersen" },
  nextFollowup: null,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext>
      <div className="w-[250px] p-4 bg-muted/50">{children}</div>
    </DndContext>
  );
}

export default {
  full: (
    <Wrapper>
      <KanbanLeadCard lead={mockLeadFull} />
    </Wrapper>
  ),
  minimal: (
    <Wrapper>
      <KanbanLeadCard lead={mockLeadMinimal} />
    </Wrapper>
  ),
  overdue: (
    <Wrapper>
      <KanbanLeadCard lead={mockLeadOverdue} />
    </Wrapper>
  ),
  longDescription: (
    <Wrapper>
      <KanbanLeadCard lead={mockLeadLongDescription} />
    </Wrapper>
  ),
  dragOverlay: (
    <div className="p-4">
      <KanbanLeadCard lead={mockLeadFull} isDragOverlay />
    </div>
  ),
};
