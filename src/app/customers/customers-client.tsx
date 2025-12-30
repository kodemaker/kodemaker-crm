"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Briefcase, Handshake } from "lucide-react";
import type { CompanyLeadCounts } from "@/types/api";

type Company = {
  id: number;
  name: string;
  websiteUrl?: string | null;
  emailDomain?: string | null;
  leadCounts?: CompanyLeadCounts;
};

export function CustomersClient() {
  const { data } = useSWR<Company[]>(`/api/companies`);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const sorted = (data || []).sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    return sorted.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);
  const router = useRouter();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Organisasjoner</h1>
      <div className="flex gap-2 items-center justify-between">
        <Input
          autoFocus
          className="max-w-sm"
          placeholder="Søk i organisasjoner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icons={[Building2, Briefcase, Handshake]}
          title="Ingen organisasjoner enda"
          description="Legg til organisasjoner dere jobber med i dag – eller vil jobbe med i morgen."
        />
      ) : (
        <div className="divide-y border rounded">
          {filtered.map((c) => {
          const newOrInProgress = (c.leadCounts?.NEW ?? 0) + (c.leadCounts?.IN_PROGRESS ?? 0);
          const showActiveLead = newOrInProgress > 1;

          return (
            <div
              key={c.id}
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30"
              onClick={() => router.push(`/customers/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/customers/${c.id}`);
                }
              }}
            >
              <div className="font-medium">{c.name}</div>
              <div className="flex items-center gap-2">
                {showActiveLead && <Badge variant="secondary">Aktiv lead</Badge>}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
