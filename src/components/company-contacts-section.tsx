"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { NewContactDialog } from "@/components/dialogs/new-contact-dialog";
import { formatDate } from "@/lib/utils";
import type { GetCompanyDetailResponse } from "@/types/api";

type CompanyContactsSectionProps = {
  company: GetCompanyDetailResponse["company"];
  contacts: GetCompanyDetailResponse["contacts"];
};

export function CompanyContactsSection({ company, contacts }: CompanyContactsSectionProps) {
  const router = useRouter();

  // Deduplicate contacts by ID, keeping the first occurrence (active contact)
  const uniqueContacts = useMemo(() => {
    const seen = new Set<number>();
    return contacts.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [contacts]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-medium">Kontakter</h2>
        <NewContactDialog companyId={company.id} companyName={company.name} />
      </div>
      <div className="divide-y rounded border">
        {uniqueContacts.length ? (
          uniqueContacts.map((c) => (
            <div
              key={c.id}
              className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted"
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/contacts/${c.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/contacts/${c.id}`);
                }
              }}
            >
              <div>
                <div className="font-medium">
                  {c.firstName} {c.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.role ?? ""}
                  {c.endDate && (
                    <>
                      {c.role ? " · " : ""}
                      Sluttet: {formatDate(c.endDate)}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-3 text-sm text-muted-foreground">Ingen</div>
        )}
      </div>
    </section>
  );
}
