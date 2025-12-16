// Contacts
export type ApiContact = {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  linkedInUrl?: string | null;
  description?: string | null;
  createdAt: string;
};

type ApiCompanyBrief = {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  role?: string | null;
};

export type ApiComment = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
};

export type ApiFollowup = {
  id: number;
  note: string;
  dueAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
};

export type LeadStatus = "NEW" | "IN_PROGRESS" | "ON_HOLD" | "LOST" | "WON" | "BORTFALT";

export type ApiLead = {
  id: number;
  description: string;
  status: LeadStatus;
  potentialValue?: number | null;
};

export type ApiEmail = {
  id: number;
  subject?: string | null;
  content: string;
  createdAt: string;
  sourceUser?: { firstName?: string | null; lastName?: string | null } | null;
  recipientContact?: { firstName?: string | null; lastName?: string | null } | null;
};

export type ApiContactEmail = {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
};

export type GetContactDetailResponse = {
  contact: ApiContact;
  currentCompany: ApiCompanyBrief | null;
  previousCompanies: ApiCompanyBrief[];
  comments: ApiComment[];
  followups: ApiFollowup[];
  leads: ApiLead[];
  emails: ApiEmail[];
  contactEmails: ApiContactEmail[];
  history: Array<{
    id: number;
    startDate: string;
    endDate?: string | null;
    role?: string | null;
    company: { id: number; name: string };
  }>;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
};

// Companies
export type ApiCompany = {
  id: number;
  name: string;
  websiteUrl?: string | null;
  emailDomain?: string | null;
  description?: string | null;
  createdAt: string;
};

export type GetCompanyDetailResponse = {
  company: ApiCompany;
  contacts: Array<{
    id: number;
    firstName: string;
    lastName: string;
    role?: string | null;
    phone?: string | null;
    linkedInUrl?: string | null;
    emails: string[];
    endDate?: string | null;
  }>;
  comments: ApiComment[];
  leads: Array<{
    id: number;
    status: LeadStatus;
    description: string;
    potentialValue?: number | null;
    contactId?: number | null;
  }>;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
};

// Contacts list
export type ListContactsItem = {
  id: number;
  firstName: string;
  lastName: string;
  role?: string | null;
  emails: string;
  company?: { id: number; name: string } | null;
};

// Activity Events (Hendelseslogg)
export type ActivityEventType =
  | "comment_created"
  | "lead_created"
  | "lead_status_changed"
  | "email_received";

export type ApiActivityEvent = {
  id: number;
  eventType: ActivityEventType;
  createdAt: string;
  actorUser: { id: number; firstName: string; lastName: string } | null;
  oldStatus: LeadStatus | null;
  newStatus: LeadStatus | null;
  // Related data (populated based on eventType)
  comment: {
    id: number;
    content: string;
    createdAt: string;
    companyId: number | null;
    contactId: number | null;
    leadId: number | null;
  } | null;
  lead: {
    id: number;
    description: string;
    status: LeadStatus;
    companyId: number;
    contactId: number | null;
  } | null;
  email: {
    id: number;
    subject: string | null;
    content: string;
    createdAt: string;
    recipientContactId: number | null;
    recipientCompanyId: number | null;
    sourceUserId: number | null;
  } | null;
  // Context entities
  company: { id: number; name: string } | null;
  contact: { id: number; firstName: string | null; lastName: string | null } | null;
};

export type GetActivityEventsResponse = {
  events: ApiActivityEvent[];
  hasMore: boolean;
};
