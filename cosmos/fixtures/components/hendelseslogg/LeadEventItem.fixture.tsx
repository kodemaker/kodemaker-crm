"use client";

import { LeadEventItem } from "@/components/hendelseslogg/lead-event-item";
import type { ApiActivityEvent } from "@/types/api";

const baseEvent: ApiActivityEvent = {
  id: 1,
  eventType: "lead_created",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: null,
  lead: {
    id: 1,
    description: "Interessert i frontend-utvikling med React og TypeScript",
    status: "NEW",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

const statusChangeEvent: ApiActivityEvent = {
  id: 2,
  eventType: "lead_status_changed",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: "NEW",
  newStatus: "IN_PROGRESS",
  comment: null,
  lead: {
    id: 1,
    description: "Interessert i frontend-utvikling med React og TypeScript",
    status: "IN_PROGRESS",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

export default {
  "New Lead": <LeadEventItem event={baseEvent} />,
  "Status Change (NY → Under arbeid)": <LeadEventItem event={statusChangeEvent} />,
  "Status Change (Under arbeid → Vunnet)": (
    <LeadEventItem
      event={{
        ...statusChangeEvent,
        id: 3,
        oldStatus: "IN_PROGRESS",
        newStatus: "WON",
        lead: { ...statusChangeEvent.lead!, status: "WON" },
      }}
    />
  ),
  "Status Change (Under arbeid → Tapt)": (
    <LeadEventItem
      event={{
        ...statusChangeEvent,
        id: 4,
        oldStatus: "IN_PROGRESS",
        newStatus: "LOST",
        lead: { ...statusChangeEvent.lead!, status: "LOST" },
      }}
    />
  ),
  "Status Change (Under arbeid → Bortfalt)": (
    <LeadEventItem
      event={{
        ...statusChangeEvent,
        id: 5,
        oldStatus: "IN_PROGRESS",
        newStatus: "BORTFALT",
        lead: { ...statusChangeEvent.lead!, status: "BORTFALT" },
      }}
    />
  ),
  "Long Description": (
    <LeadEventItem
      event={{
        ...baseEvent,
        id: 6,
        lead: {
          ...baseEvent.lead!,
          description:
            "En veldig lang beskrivelse av leaden som går over flere linjer og bør bli avkortet på en pen måte for å unngå at UI-et blir rotete. Dette er en test av trunkering.",
        },
      }}
    />
  ),
  "Without Contact": (
    <LeadEventItem
      event={{
        ...baseEvent,
        id: 7,
        contact: null,
      }}
    />
  ),
};
