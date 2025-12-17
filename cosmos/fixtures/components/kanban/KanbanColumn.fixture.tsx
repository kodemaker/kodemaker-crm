import React from "react";
import { DndContext } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import type { KanbanLead } from "@/components/kanban/kanban-lead-card";

const mockLeads: KanbanLead[] = [
  {
    id: 1,
    description: "Første lead med lang beskrivelse",
    status: "NEW",
    potentialValue: 500000,
    company: { id: 1, name: "Acme Corp" },
    contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
    nextFollowup: {
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: { firstName: "Kari", lastName: "Hansen" },
    },
  },
  {
    id: 2,
    description: "Andre lead uten følging",
    status: "NEW",
    potentialValue: 250000,
    company: { id: 2, name: "Tech Solutions AS" },
    contact: null,
    nextFollowup: null,
  },
  {
    id: 3,
    description: "Tredje lead med minimal info",
    status: "NEW",
    company: null,
    contact: null,
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext>
      <div className="h-[600px] p-4 bg-background">{children}</div>
    </DndContext>
  );
}

export default {
  withLeads: (
    <Wrapper>
      <KanbanColumn id="status-NEW" title="Ny" leads={mockLeads} />
    </Wrapper>
  ),
  empty: (
    <Wrapper>
      <KanbanColumn id="status-IN_PROGRESS" title="Under arbeid" leads={[]} />
    </Wrapper>
  ),
  singleLead: (
    <Wrapper>
      <KanbanColumn id="status-ON_HOLD" title="Satt på vent" leads={[mockLeads[0]]} />
    </Wrapper>
  ),
};
