"use client";
import useSWR, { useSWRConfig } from "swr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Company = {
  id: number;
  name: string;
  websiteUrl?: string | null;
  emailDomain?: string | null;
  description?: string | null;
};

export default function EditCompanyPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { data, mutate } = useSWR<{ company: Company }>(id ? `/api/companies/${id}` : null);
  const company = data?.company;
  const [name, setName] = useState(company?.name || "");
  const [websiteUrl, setWebsiteUrl] = useState(company?.websiteUrl || "");
  const [emailDomain, setEmailDomain] = useState(company?.emailDomain || "");
  const [description, setDescription] = useState(company?.description || "");

  useEffect(() => {
    if (!company) return;
    setName(company.name || "");
    setWebsiteUrl(company.websiteUrl || "");
    setEmailDomain(company.emailDomain || "");
    setDescription(company.description || "");
  }, [company]);

  async function save() {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, websiteUrl, emailDomain, description }),
    });
    if (!res.ok) return;
    await mutate();
    router.push(`/customers/${id}`);
  }

  if (!company) return <div className="p-6">Laster…</div>;

  return (
    <div className="p-6 space-y-4">
      <PageBreadcrumbs
        items={[
          { label: "Organisasjoner", href: "/customers" },
          { label: company.name, href: `/customers/${company.id}` },
          { label: "Endre" },
        ]}
      />
      <div className="grid gap-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Navn</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Website</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={websiteUrl ?? ""}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">E-postdomene</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={emailDomain ?? ""}
            onChange={(e) => setEmailDomain(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Beskrivelse</label>
          <textarea
            className="w-full border rounded p-2 text-sm resize-y"
            rows={3}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskrivelse..."
          />
        </div>
        <div className="flex justify-between gap-2">
          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm("Slette kunde? Leads, kommentarer, oppfølginger, e-poster og hendelser knyttet til denne kunden vil også bli slettet. Dette kan ikke angres.")) return;
              const res = await fetch(`/api/companies/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                // Invalidate companies cache
                await globalMutate((key) => typeof key === "string" && key.startsWith("/api/companies"));
                router.push("/customers");
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Slett
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/customers/${id}`)}>
              <X className="h-4 w-4" /> Avbryt
            </Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Lagre
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
