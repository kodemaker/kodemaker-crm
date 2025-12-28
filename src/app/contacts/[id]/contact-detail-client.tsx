"use client";
import useSWR from "swr";
import { useState } from "react";
import { useParams } from "next/navigation";
import { NewLeadDialog } from "@/components/dialogs/new-lead-dialog";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { ContactHeader } from "@/components/entity-summary-header";
import { ActivityLog } from "@/components/activity-log";
import { CreatedBy } from "@/components/created-by";
import { ContactCompaniesSection } from "@/components/contact-companies-section";
import { LeadsSection } from "@/components/leads-section";
import type { GetContactDetailResponse } from "@/types/api";

export function ContactDetailClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data } = useSWR<GetContactDetailResponse>(id ? `/api/contacts/${id}` : null);
  const [newLeadDialogOpen, setNewLeadDialogOpen] = useState(false);

  if (!data) return <div className="p-4 md:p-6">Laster...</div>;
  const { contact, currentCompany, previousCompanies, leads, contactEmails } = data;

  const crumbs = [
    { label: "Organisasjoner", href: "/customers" },
    ...(currentCompany
      ? [
          {
            label: currentCompany.name,
            href: `/customers/${currentCompany.id}`,
          },
        ]
      : []),
    { label: `${contact.firstName} ${contact.lastName}` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageBreadcrumbs items={crumbs} />
      <ContactHeader
        contact={contact}
        contactEmails={contactEmails}
        currentCompany={currentCompany}
        editHref={`/contacts/${contact.id}/edit`}
      />

      <LeadsSection
        leads={leads}
        headerAction={
          <NewLeadDialog
            companyId={currentCompany?.id}
            companyName={currentCompany?.name}
            contactId={contact.id}
            contactName={`${contact.firstName} ${contact.lastName}`}
          />
        }
        emptyStateAction={{
          label: "Legg til lead",
          onClick: () => setNewLeadDialogOpen(true),
        }}
      />

      {/* Controlled dialog for empty state action */}
      <NewLeadDialog
        companyId={currentCompany?.id}
        companyName={currentCompany?.name}
        contactId={contact.id}
        contactName={`${contact.firstName} ${contact.lastName}`}
        trigger={null}
        open={newLeadDialogOpen}
        onOpenChange={setNewLeadDialogOpen}
      />

      <ActivityLog
        contactId={contact.id}
        contactName={`${contact.firstName} ${contact.lastName}`}
        companyId={currentCompany?.id}
        companyName={currentCompany?.name}
      />

      <ContactCompaniesSection previousCompanies={previousCompanies} />

      <CreatedBy createdAt={contact.createdAt} createdBy={data.createdBy} />
    </div>
  );
}
