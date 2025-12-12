import React from "react";
import Link from "next/link";
import {
  AtSign,
  BriefcaseBusiness,
  Building2,
  FileText,
  Globe2,
  Link2,
  Mail,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import type { GetCompanyDetailResponse, GetContactDetailResponse } from "@/types/api";

type HeaderItem = {
  icon: React.ReactNode;
  label: string;
  content: React.ReactNode;
};

type EntitySummaryHeaderProps = {
  title: string;
  editHref?: string;
  items: HeaderItem[];
  /** Optional long-form description block shown under the compact items */
  description?: React.ReactNode;
};

export function EntitySummaryHeader({
  title,
  editHref,
  items,
  description,
}: EntitySummaryHeaderProps) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold break-words min-w-0 flex-1">{title}</h1>
        {editHref ? (
          <Button asChild className="shrink-0">
            <Link href={editHref}>
              <Pencil className="h-4 w-4" />
              <span>Endre</span>
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="text-sm text-muted-foreground mt-2 space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-muted-foreground">
              {item.icon}
            </span>
            <div>{item.content}</div>
          </div>
        ))}
        {description ? (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <div className="font-medium text-foreground">Beskrivelse</div>
                <div className="whitespace-pre-wrap">{description}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type ContactHeaderProps = {
  contact: GetContactDetailResponse["contact"];
  contactEmails: GetContactDetailResponse["contactEmails"];
  currentCompany: GetContactDetailResponse["currentCompany"];
  editHref: string;
};

export function ContactHeader({
  contact,
  contactEmails,
  currentCompany,
  editHref,
}: ContactHeaderProps) {
  const items: HeaderItem[] = [];

  const activeEmails = contactEmails.filter((email) => email.active);
  if (activeEmails.length > 0) {
    items.push({
      label: "E-post",
      icon: <Mail className="h-4 w-4" />,
      content: (
        <div className="flex flex-wrap gap-x-1">
          {activeEmails.map((email, index) => (
            <span key={email.id}>
              {email.email}
              {index < activeEmails.length - 1 ? "," : null}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (contact.linkedInUrl) {
    items.push({
      label: "LinkedIn",
      icon: <Link2 className="h-4 w-4" />,
      content: (
        <a href={contact.linkedInUrl} target="_blank" rel="noreferrer" className="underline">
          LinkedIn
        </a>
      ),
    });
  }

  if (currentCompany?.name) {
    items.push({
      label: "Kontor",
      icon: <Building2 className="h-4 w-4" />,
      content: <span>{currentCompany.name}</span>,
    });
  }

  if (contact.phone) {
    items.push({
      label: "Telefon",
      icon: <Phone className="h-4 w-4" />,
      content: <span>{contact.phone}</span>,
    });
  }

  if (currentCompany?.role) {
    items.push({
      label: "Rolle",
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      content: <span>{currentCompany.role}</span>,
    });
  }

  if (contact.description) {
    items.push({
      label: "Beskrivelse",
      icon: <FileText className="h-4 w-4" />,
      content: <div className="whitespace-pre-wrap">{contact.description}</div>,
    });
  }

  return (
    <EntitySummaryHeader
      title={`${contact.firstName} ${contact.lastName}`}
      editHref={editHref}
      items={items}
    />
  );
}

type CompanyHeaderProps = {
  company: GetCompanyDetailResponse["company"];
  editHref: string;
};

export function CompanyHeader({ company, editHref }: CompanyHeaderProps) {
  const items: HeaderItem[] = [];

  if (company.websiteUrl) {
    items.push({
      label: "Nettside",
      icon: <Globe2 className="h-4 w-4" />,
      content: (
        <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="underline">
          {company.websiteUrl}
        </a>
      ),
    });
  }

  if (company.emailDomain) {
    items.push({
      label: "Domene",
      icon: <AtSign className="h-4 w-4" />,
      content: <span>{company.emailDomain}</span>,
    });
  }

  if (company.description) {
    items.push({
      label: "Beskrivelse",
      icon: <FileText className="h-4 w-4" />,
      content: <div className="whitespace-pre-wrap">{company.description}</div>,
    });
  }

  return <EntitySummaryHeader title={company.name} editHref={editHref} items={items} />;
}

type LeadHeaderProps = {
  company: { id: number; name: string } | null | undefined;
  contact: { id: number; firstName: string; lastName: string } | null | undefined;
};

export function LeadHeader({ company, contact }: LeadHeaderProps) {
  const items: HeaderItem[] = [];

  if (contact) {
    items.push({
      label: "Kontakt",
      icon: <User className="h-4 w-4" />,
      content: (
        <Link href={`/contacts/${contact.id}`} className="underline">
          {contact.firstName} {contact.lastName}
        </Link>
      ),
    });
  }

  if (company) {
    items.push({
      label: "Organisasjon",
      icon: <Building2 className="h-4 w-4" />,
      content: (
        <Link href={`/customers/${company.id}`} className="underline">
          {company.name}
        </Link>
      ),
    });
  }

  return <EntitySummaryHeader title="Lead" items={items} />;
}
