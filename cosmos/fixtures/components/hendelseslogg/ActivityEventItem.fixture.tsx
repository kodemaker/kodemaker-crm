"use client";

import { ActivityEventItem } from "@/components/hendelseslogg/activity-event-item";
import type { ApiActivityEvent } from "@/types/api";

const commentEvent: ApiActivityEvent = {
  id: 1,
  eventType: "comment_created",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: {
    id: 1,
    content: "Ringte kunden, de er veldig interessert.",
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
    content: "Hadde et godt møte med kunden. De vil ha et tilbud.",
    createdAt: new Date().toISOString(),
    companyId: 1,
    contactId: 1,
    leadId: 1,
  },
  lead: {
    id: 1,
    description: "Frontend-utvikling prosjekt",
    status: "IN_PROGRESS",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

const leadCreatedEvent: ApiActivityEvent = {
  id: 2,
  eventType: "lead_created",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: null,
  newStatus: null,
  comment: null,
  lead: {
    id: 1,
    description: "Frontend-utvikling prosjekt",
    status: "NEW",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

const statusChangeEvent: ApiActivityEvent = {
  id: 3,
  eventType: "lead_status_changed",
  createdAt: new Date().toISOString(),
  actorUser: { id: 1, firstName: "Marina", lastName: "Hauge" },
  oldStatus: "NEW",
  newStatus: "IN_PROGRESS",
  comment: null,
  lead: {
    id: 1,
    description: "Frontend-utvikling prosjekt",
    status: "IN_PROGRESS",
    companyId: 1,
    contactId: 1,
  },
  email: null,
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

const emailEvent: ApiActivityEvent = {
  id: 4,
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
    content: "Hei, takk for hyggelig samtale.\n\nMvh, Ola",
    createdAt: new Date().toISOString(),
    recipientContactId: 1,
    recipientCompanyId: 1,
    sourceUserId: 1,
  },
  company: { id: 1, name: "Tech AS" },
  contact: { id: 1, firstName: "Ola", lastName: "Nordmann" },
};

export default {
  Comment: <ActivityEventItem event={commentEvent} />,
  "Comment on Lead": <ActivityEventItem event={commentOnLeadEvent} />,
  "New Lead": <ActivityEventItem event={leadCreatedEvent} />,
  "Status Change": <ActivityEventItem event={statusChangeEvent} />,
  Email: <ActivityEventItem event={emailEvent} />,
  "New (highlighted)": <ActivityEventItem event={commentEvent} isNew />,
  "All Types List": (
    <div className="border rounded">
      <ActivityEventItem event={commentEvent} />
      <ActivityEventItem event={commentOnLeadEvent} />
      <ActivityEventItem event={leadCreatedEvent} />
      <ActivityEventItem event={statusChangeEvent} />
      <ActivityEventItem event={emailEvent} />
      <ActivityEventItem event={{ ...commentEvent, id: 7 }} isNew />
    </div>
  ),
};
