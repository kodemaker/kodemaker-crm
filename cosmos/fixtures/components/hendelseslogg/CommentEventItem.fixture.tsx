"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { CommentEventItem } from "@/components/hendelseslogg/comment-event-item";
import type { ApiActivityEvent } from "@/types/api";

const baseEvent: ApiActivityEvent = {
  id: 1,
  eventType: "comment_created",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: {
    id: 1,
    content: "Ringte kunden, de er veldig interessert i å fortsette samtalen.",
    createdAt: new Date().toISOString(),
    companyId: 1,
    contactId: 1,
    leadId: null,
  },
  lead: null,
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

const commentOnLeadEvent: ApiActivityEvent = {
  id: 6,
  eventType: "comment_created",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: {
    id: 2,
    content: "Hadde et godt møte med kunden. De vil ha et tilbud innen fredag.",
    createdAt: new Date().toISOString(),
    companyId: 1,
    contactId: 1,
    leadId: 1,
  },
  lead: {
    id: 1,
    description: "Frontend-utvikling prosjekt med React og TypeScript",
    status: "IN_PROGRESS",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

export default {
  "Comment on Contact": (
    <TooltipProvider>
      <CommentEventItem event={baseEvent} />
    </TooltipProvider>
  ),
  "Comment on Company": (
    <TooltipProvider>
      <CommentEventItem
        event={{
          ...baseEvent,
          id: 2,
          contact: null,
          comment: {
            ...baseEvent.comment!,
            contactId: null,
          },
        }}
      />
    </TooltipProvider>
  ),
  "Comment on Lead": (
    <TooltipProvider>
      <CommentEventItem event={commentOnLeadEvent} />
    </TooltipProvider>
  ),
  "Long Comment": (
    <TooltipProvider>
      <CommentEventItem
        event={{
          ...baseEvent,
          id: 4,
          comment: {
            ...baseEvent.comment!,
            content: `Dette er en veldig lang kommentar som strekker seg over flere linjer.

Vi diskuterte følgende punkter:
1. Prosjektomfang og tidsramme
2. Tekniske krav og stack
3. Budsjett og ressurser
4. Neste steg i prosessen

Kunden virker veldig interessert og ønsker å fortsette samtalen neste uke.`,
          },
        }}
      />
    </TooltipProvider>
  ),
  "Without Actor": (
    <TooltipProvider>
      <CommentEventItem
        event={{
          ...baseEvent,
          id: 5,
          actorUser: null,
        }}
      />
    </TooltipProvider>
  ),
};
