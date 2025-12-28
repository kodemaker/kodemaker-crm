"use client";

import { useState } from "react";
import { http, HttpResponse } from "msw";
import { ContactSelect, type ContactOption } from "@/components/selects/contact-select";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

const mockContacts: ContactOption[] = [
  { id: 1, firstName: "Kari", lastName: "Nordmann" },
  { id: 2, firstName: "Ola", lastName: "Hansen" },
  { id: 3, firstName: "Per", lastName: "Larsen" },
  { id: 4, firstName: "Anne", lastName: "Berg" },
  { id: 5, firstName: "Erik", lastName: "Svendsen" },
];

const companyFilteredContacts: ContactOption[] = [
  { id: 1, firstName: "Kari", lastName: "Nordmann" },
  { id: 2, firstName: "Ola", lastName: "Hansen" },
];

function InteractiveContactSelect() {
  const [value, setValue] = useState<ContactOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/contacts", () => HttpResponse.json(mockContacts)),
    http.post("/api/contacts", async ({ request }) => {
      const body = (await request.json()) as { firstName: string; lastName: string };
      return HttpResponse.json(
        { id: 99, firstName: body.firstName, lastName: body.lastName },
        { status: 201 }
      );
    }),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <ContactSelect value={value} onChange={setValue} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.firstName} ${value.lastName} (ID: ${value.id})` : "Ingen"}
      </div>
    </div>
  );
}

function PreselectedContactSelect() {
  const [value, setValue] = useState<ContactOption | null>(mockContacts[0]);

  const ready = useFixtureHandlers([
    http.get("/api/contacts", () => HttpResponse.json(mockContacts)),
    http.post("/api/contacts", async ({ request }) => {
      const body = (await request.json()) as { firstName: string; lastName: string };
      return HttpResponse.json(
        { id: 99, firstName: body.firstName, lastName: body.lastName },
        { status: 201 }
      );
    }),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <ContactSelect value={value} onChange={setValue} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.firstName} ${value.lastName}` : "Ingen"}
      </div>
    </div>
  );
}

function FilteredByCompanyContactSelect() {
  const [value, setValue] = useState<ContactOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/contacts", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("companyId") === "1") {
        return HttpResponse.json(companyFilteredContacts);
      }
      return HttpResponse.json(mockContacts);
    }),
    http.post("/api/contacts", async ({ request }) => {
      const body = (await request.json()) as { firstName: string; lastName: string };
      return HttpResponse.json(
        { id: 99, firstName: body.firstName, lastName: body.lastName },
        { status: 201 }
      );
    }),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <p className="text-sm text-muted-foreground">
        Filtrert til kontakter i Kodemaker (ID: 1)
      </p>
      <ContactSelect value={value} onChange={setValue} companyId={1} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.firstName} ${value.lastName}` : "Ingen"}
      </div>
    </div>
  );
}

function DisabledContactSelect() {
  const ready = useFixtureHandlers([
    http.get("/api/contacts", () => HttpResponse.json(mockContacts)),
  ]);

  if (!ready) return null;

  return (
    <div className="w-80">
      <ContactSelect value={mockContacts[0]} onChange={() => {}} disabled />
    </div>
  );
}

export default {
  default: <InteractiveContactSelect />,
  preselected: <PreselectedContactSelect />,
  filteredByCompany: <FilteredByCompanyContactSelect />,
  disabled: <DisabledContactSelect />,
};
