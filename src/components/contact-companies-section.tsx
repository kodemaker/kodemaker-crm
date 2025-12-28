"use client";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { GetContactDetailResponse } from "@/types/api";

type ContactCompaniesSectionProps = {
  previousCompanies: GetContactDetailResponse["previousCompanies"];
};

export function ContactCompaniesSection({ previousCompanies }: ContactCompaniesSectionProps) {
  const router = useRouter();

  // Don't render anything if there are no previous companies
  if (previousCompanies.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-medium">Tidligere organisasjoner</h2>
      <div className="divide-y rounded border">
        {previousCompanies.map((co) => (
          <div
            key={`${co.id}-${co.startDate}-${co.endDate}`}
            className="cursor-pointer p-3 hover:bg-muted"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/customers/${co.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/customers/${co.id}`);
              }
            }}
          >
            <div className="font-medium">{co.name}</div>
            <div className="text-sm text-muted-foreground">
              {co.role ?? ""}
              {co.startDate && co.endDate && (
                <>
                  {co.role ? " · " : ""}
                  {formatDate(co.startDate)} - {formatDate(co.endDate)}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
