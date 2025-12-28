"use client";

import { useState } from "react";
import { http, HttpResponse } from "msw";
import { CompanySelect, type CompanyOption } from "@/components/selects/company-select";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

const mockCompanies: CompanyOption[] = [
  { id: 1, name: "Kodemaker" },
  { id: 2, name: "Acme Corp" },
  { id: 3, name: "Bekk Consulting" },
  { id: 4, name: "Computas" },
  { id: 5, name: "Kantega" },
];

function InteractiveCompanySelect() {
  const [value, setValue] = useState<CompanyOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/companies", () => HttpResponse.json(mockCompanies)),
    http.post("/api/companies", async ({ request }) => {
      const body = (await request.json()) as { name: string };
      return HttpResponse.json({ id: 99, name: body.name }, { status: 201 });
    }),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <CompanySelect value={value} onChange={setValue} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.name} (ID: ${value.id})` : "Ingen"}
      </div>
    </div>
  );
}

function PreselectedCompanySelect() {
  const [value, setValue] = useState<CompanyOption | null>(mockCompanies[0]);

  const ready = useFixtureHandlers([
    http.get("/api/companies", () => HttpResponse.json(mockCompanies)),
    http.post("/api/companies", async ({ request }) => {
      const body = (await request.json()) as { name: string };
      return HttpResponse.json({ id: 99, name: body.name }, { status: 201 });
    }),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <CompanySelect value={value} onChange={setValue} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.name} (ID: ${value.id})` : "Ingen"}
      </div>
    </div>
  );
}

function DisabledCompanySelect() {
  const ready = useFixtureHandlers([
    http.get("/api/companies", () => HttpResponse.json(mockCompanies)),
  ]);

  if (!ready) return null;

  return (
    <div className="w-80">
      <CompanySelect value={mockCompanies[0]} onChange={() => {}} disabled />
    </div>
  );
}

function NoCreateCompanySelect() {
  const [value, setValue] = useState<CompanyOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/companies", () => HttpResponse.json(mockCompanies)),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <CompanySelect value={value} onChange={setValue} allowCreate={false} />
      <p className="text-sm text-muted-foreground">Uten "Lag ny" knapp</p>
    </div>
  );
}

export default {
  default: <InteractiveCompanySelect />,
  preselected: <PreselectedCompanySelect />,
  disabled: <DisabledCompanySelect />,
  noCreate: <NoCreateCompanySelect />,
};
