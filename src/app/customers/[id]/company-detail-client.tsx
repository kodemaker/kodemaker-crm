"use client";
import useSWR from "swr";
import { useState } from "react";
import { useParams } from "next/navigation";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { CreatedBy } from "@/components/created-by";
import { CompanyHeader } from "@/components/entity-summary-header";
import { CompanyContactsSection } from "@/components/company-contacts-section";
import { LeadsSection } from "@/components/leads-section";
import { ActivityLog } from "@/components/activity-log";
import { NewLeadDialog } from "@/components/dialogs/new-lead-dialog";
import type { GetCompanyDetailResponse } from "@/types/api";

export function CompanyDetailClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data } = useSWR<GetCompanyDetailResponse>(id ? `/api/companies/${id}` : null);
  const [newLeadDialogOpen, setNewLeadDialogOpen] = useState(false);

  if (!data) return <div className="p-6">Laster...</div>;
  const { company, contacts, leads } = data;
  const contactIds = contacts.map((c) => c.id);

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Organisasjoner", href: "/customers" },
          {
            label: company.name,
          },
        ]}
      />
      <CompanyHeader company={company} editHref={`/customers/${company.id}/edit`} />

      <LeadsSection
        leads={leads}
        headerAction={<NewLeadDialog companyId={company.id} companyName={company.name} />}
        emptyStateAction={{
          label: "Legg til lead",
          onClick: () => setNewLeadDialogOpen(true),
        }}
      />

      {/* Controlled dialog for empty state action */}
      <NewLeadDialog
        companyId={company.id}
        companyName={company.name}
        trigger={null}
        open={newLeadDialogOpen}
        onOpenChange={setNewLeadDialogOpen}
      />

      <ActivityLog
        companyId={company.id}
        contactIds={contactIds.length > 0 ? contactIds : undefined}
      />

      <CompanyContactsSection company={company} contacts={contacts} />

      <CreatedBy createdAt={company.createdAt} createdBy={data.createdBy} />
    </div>
  );
}
