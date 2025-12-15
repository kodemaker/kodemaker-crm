"use client";

import { EmailEventItem } from "@/components/hendelseslogg/email-event-item";
import type { ApiActivityEvent } from "@/types/api";

const baseEvent: ApiActivityEvent = {
  id: 1,
  eventType: "email_received",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: null,
  lead: null,
  email: {
    id: 1,
    subject: "RE: Prosjektforespørsel",
    content:
      "Hei Marina,\n\nTakk for hyggelig samtale. Vi er interessert i å fortsette dialogen om frontend-utvikling.\n\nMvh,\nOla Nordmann",
    createdAt: new Date().toISOString(),
    recipientContactId: 1,
    recipientCompanyId: 1,
    sourceUserId: 1,
  },
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

export default {
  "Email with Subject": <EmailEventItem event={baseEvent} />,
  "Email without Subject": (
    <EmailEventItem
      event={{
        ...baseEvent,
        id: 2,
        email: {
          ...baseEvent.email!,
          subject: null,
        },
      }}
    />
  ),
  "Long Email": (
    <EmailEventItem
      event={{
        ...baseEvent,
        id: 3,
        email: {
          ...baseEvent.email!,
          content: `Hei Marina,

Takk for hyggelig samtale i går. Vi har diskutert prosjektet internt og ønsker å gå videre med følgende:

1. Frontend-utvikling med React og TypeScript
2. Backend-integrasjon mot eksisterende systemer
3. Design og UX-rådgivning
4. Testing og kvalitetssikring

Vi har satt av budsjett for Q1 2024 og ønsker å starte så snart som mulig.

Kan vi sette opp et møte neste uke for å diskutere detaljer?

Med vennlig hilsen,
Ola Nordmann
Senior Developer
Tech AS

---
Denne e-posten er konfidensiell og kun ment for mottaker.`,
        },
      }}
    />
  ),
  "Without Company": (
    <EmailEventItem
      event={{
        ...baseEvent,
        id: 4,
        company: null,
      }}
    />
  ),
  "Without Actor": (
    <EmailEventItem
      event={{
        ...baseEvent,
        id: 5,
        actorUser: null,
      }}
    />
  ),
};
