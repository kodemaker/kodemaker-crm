"use client";
import { useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

import type { ListContactsItem } from "@/types/api";

export function ContactsClient() {
  const [q, setQ] = useState("");
  const query = q.trim();
  const url = query.length >= 1 ? `/api/contacts?q=${encodeURIComponent(query)}` : `/api/contacts`;
  const { data } = useSWR<ListContactsItem[]>(url);
  const rows = data ?? [];
  const router = useRouter();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Kontakter</h1>
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          className="max-w-md"
          placeholder="Søk etter fornavn, etternavn eller firma"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="border rounded divide-y">
        {rows.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Ingen treff</div>
        ) : null}
        {rows.map((r) => (
          <div
            key={r.id}
            className="p-3 hover:bg-muted cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/contacts/${r.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/contacts/${r.id}`);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {r.firstName} {r.lastName}
                </div>
                <div className="text-xs text-muted-foreground">{r.role ?? ""}</div>
              </div>
              {r.company ? (
                <a
                  href={`/customers/${r.company.id}`}
                  className="text-sm underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {r.company.name}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
