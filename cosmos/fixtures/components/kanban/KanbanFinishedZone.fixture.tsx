import React from "react";
import { DndContext } from "@dnd-kit/core";
import { KanbanFinishedZone } from "@/components/kanban/kanban-finished-zone";
import type { KanbanLead } from "@/components/kanban/kanban-lead-card";

const wonLeads: KanbanLead[] = [
  {
    id: 1,
    description: "Vunnet prosjekt for IT-modernisering",
    status: "WON",
    potentialValue: 750000,
    company: { id: 1, name: "Acme Corp" },
    contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
    nextFollowup: null,
  },
  {
    id: 2,
    description: "Vunnet rammeavtale",
    status: "WON",
    potentialValue: 1200000,
    company: { id: 2, name: "Tech Solutions AS" },
    contact: null,
    nextFollowup: null,
  },
];

const lostLeads: KanbanLead[] = [
  {
    id: 3,
    description: "Tapt til konkurrent",
    status: "LOST",
    potentialValue: 400000,
    company: { id: 3, name: "Innovasjonsselskapet" },
    contact: null,
    nextFollowup: null,
  },
];

const bortfaltLeads: KanbanLead[] = [
  {
    id: 4,
    description: "Prosjekt avlyst",
    status: "BORTFALT",
    company: { id: 4, name: "Startup Inc" },
    contact: null,
    nextFollowup: null,
  },
  {
    id: 5,
    description: "Budsjett kuttet",
    status: "BORTFALT",
    company: null,
    contact: null,
    nextFollowup: null,
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext>
      <div className="h-[600px] p-4 bg-background flex">{children}</div>
    </DndContext>
  );
}

export default {
  withLeads: (
    <Wrapper>
      <KanbanFinishedZone
        wonLeads={wonLeads}
        lostLeads={lostLeads}
        bortfaltLeads={bortfaltLeads}
        isDragging={false}
      />
    </Wrapper>
  ),
  empty: (
    <Wrapper>
      <KanbanFinishedZone wonLeads={[]} lostLeads={[]} bortfaltLeads={[]} isDragging={false} />
    </Wrapper>
  ),
  dragging: (
    <Wrapper>
      <KanbanFinishedZone
        wonLeads={wonLeads}
        lostLeads={lostLeads}
        bortfaltLeads={bortfaltLeads}
        isDragging={true}
      />
    </Wrapper>
  ),
  onlyWon: (
    <Wrapper>
      <KanbanFinishedZone wonLeads={wonLeads} lostLeads={[]} bortfaltLeads={[]} isDragging={false} />
    </Wrapper>
  ),
};
