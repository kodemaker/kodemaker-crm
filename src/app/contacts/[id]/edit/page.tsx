"use client";
import useSWR, { useSWRConfig } from "swr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Check, Edit2, GitMerge, Plus, Save, Trash2, X } from "lucide-react";
import { MergeContactsDialog } from "@/components/merge-contacts-dialog";
import { CompanyAffiliations } from "@/components/company-affiliations";

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
  description?: string | null;
};

type ContactEmail = {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
};

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { data, mutate } = useSWR<{
    contact: Contact;
    contactEmails: ContactEmail[];
    currentCompany?: { id: number; name: string } | null;
    history: Array<{
      id: number;
      startDate: string;
      endDate?: string | null;
      role?: string | null;
      company: { id: number; name: string };
    }>;
  }>(id ? `/api/contacts/${id}` : null);
  const contact = data?.contact;
  const currentCompany = data?.currentCompany;
  const history = data?.history || [];
  const [firstName, setFirstName] = useState(contact?.firstName || "");
  const [lastName, setLastName] = useState(contact?.lastName || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [linkedInUrl, setLinkedInUrl] = useState(contact?.linkedInUrl || "");
  const [description, setDescription] = useState(contact?.description || "");

  // Email management state
  const [emails, setEmails] = useState<ContactEmail[]>([]);
  const [newEmailAddress, setNewEmailAddress] = useState("");
  const [editingEmailId, setEditingEmailId] = useState<number | null>(null);
  const [editingEmailAddress, setEditingEmailAddress] = useState("");

  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const { data: contactCounts } = useSWR<{
    emailAddresses: number;
    emails: number;
    leads: number;
    comments: number;
    events: number;
    followups: number;
  }>(id ? `/api/contacts/${id}/counts` : null);

  // Re-sync local state when data loads
  useEffect(() => {
    if (!contact) return;
    setFirstName(contact.firstName || "");
    setLastName(contact.lastName || "");
    setPhone(contact.phone || "");
    setLinkedInUrl(contact.linkedInUrl || "");
    setDescription(contact.description || "");
  }, [contact]);

  useEffect(() => {
    const contactEmails = data?.contactEmails || [];
    setEmails(contactEmails);
  }, [data?.contactEmails]);

  async function save() {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        linkedInUrl,
        description,
      }),
    });
    if (!res.ok) return;
    await mutate();
    router.push(`/contacts/${id}`);
  }

  async function addEmail() {
    if (!newEmailAddress.trim()) return;

    const res = await fetch(`/api/contacts/${id}/emails`, {
      method: "POST",
      body: JSON.stringify({ email: newEmailAddress.trim(), active: true }),
    });

    if (res.ok) {
      setNewEmailAddress("");
      await mutate();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to add email");
    }
  }

  async function updateEmail(emailId: number, email: string, active: boolean) {
    const res = await fetch(`/api/contacts/${id}/emails/${emailId}`, {
      method: "PATCH",
      body: JSON.stringify({ email, active }),
    });

    if (res.ok) {
      setEditingEmailId(null);
      setEditingEmailAddress("");
      await mutate();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to update email");
    }
  }

  async function deleteEmail(emailId: number) {
    if (!confirm("Delete this email address?")) return;

    const res = await fetch(`/api/contacts/${id}/emails/${emailId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await mutate();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to delete email");
    }
  }

  async function handleMerge(mergeData: {
    targetContactId: number;
    mergeEmailAddresses: boolean;
    mergeEmails: boolean;
    mergeLeads: boolean;
    mergeComments: boolean;
    mergeEvents: boolean;
    mergeFollowups: boolean;
    deleteSourceContact: boolean;
  }) {
    const res = await fetch(`/api/contacts/${id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mergeData),
    });

    if (res.ok) {
      const result = await res.json();
      alert(result.message || "Merge completed successfully");

      if (mergeData.deleteSourceContact) {
        // If source contact was deleted, redirect to contacts list
        router.push("/contacts");
      } else {
        // Otherwise redirect to the contact view page
        router.push(`/contacts/${id}`);
      }
    } else {
      const error = await res.json();
      alert(error.error || "Failed to merge contacts");
      throw new Error(error.error || "Failed to merge contacts");
    }
  }

  if (!contact) return <div className="p-6">Laster…</div>;

  return (
    <div className="p-6 space-y-4">
      <PageBreadcrumbs
        items={[
          { label: "Kontakter", href: "/contacts" },
          {
            label: `${contact.firstName} ${contact.lastName}`,
            href: `/contacts/${id}`,
          },
          { label: "Endre" },
        ]}
      />
      <div className="grid gap-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Fornavn</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Etternavn</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">E-postadresser</label>
          <div className="space-y-2">
            {emails.map((emailItem) => (
              <div key={emailItem.id} className="flex items-center gap-2 p-2 border rounded">
                {editingEmailId === emailItem.id ? (
                  <>
                    <input
                      className="flex-1 border rounded p-1 text-sm"
                      value={editingEmailAddress}
                      onChange={(e) => setEditingEmailAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateEmail(emailItem.id, editingEmailAddress, emailItem.active);
                        } else if (e.key === "Escape") {
                          setEditingEmailId(null);
                          setEditingEmailAddress("");
                        }
                      }}
                      autoFocus
                    />
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={emailItem.active}
                        onChange={(e) =>
                          updateEmail(emailItem.id, editingEmailAddress, e.target.checked)
                        }
                        className="mr-1"
                      />
                      Aktiv
                    </label>
                    <button
                      onClick={() =>
                        updateEmail(emailItem.id, editingEmailAddress, emailItem.active)
                      }
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmailId(null);
                        setEditingEmailAddress("");
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{emailItem.email}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        emailItem.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {emailItem.active ? "Aktiv" : "Inaktiv"}
                    </span>
                    <button
                      onClick={() => {
                        setEditingEmailId(emailItem.id);
                        setEditingEmailAddress(emailItem.email);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await updateEmail(emailItem.id, emailItem.email, !emailItem.active);
                      }}
                      className={`text-sm px-2 py-1 rounded ${
                        emailItem.active
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-green-200 text-green-700 hover:bg-green-300"
                      }`}
                    >
                      {emailItem.active ? "Deaktiver" : "Aktiver"}
                    </button>
                    <button
                      onClick={() => deleteEmail(emailItem.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border rounded p-2 text-sm"
                placeholder="Legg til ny e-postadresse..."
                value={newEmailAddress}
                onChange={(e) => setNewEmailAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addEmail();
                  }
                }}
              />
              <button
                onClick={addEmail}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Legg til
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Telefon</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">LinkedIn</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={linkedInUrl ?? ""}
            onChange={(e) => setLinkedInUrl(e.target.value)}
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
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1.5"
              onClick={async () => {
                if (!confirm("Slette kontakt? Kommentarer, oppfølginger, e-poster og hendelser knyttet til denne kontakten vil også bli slettet. Dette kan ikke angres.")) return;
                const res = await fetch(`/api/contacts/${id}`, {
                  method: "DELETE",
                });
                if (res.ok) {
                  // Invalidate caches
                  await Promise.all([
                    globalMutate((key) => typeof key === "string" && key.startsWith("/api/contacts")),
                    currentCompany && globalMutate(`/api/companies/${currentCompany.id}`),
                  ]);
                  // Navigate to company if exists, else contacts list
                  router.push(currentCompany ? `/customers/${currentCompany.id}` : "/contacts");
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Slett
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 inline-flex items-center gap-1.5"
              onClick={() => setMergeDialogOpen(true)}
            >
              <GitMerge className="h-4 w-4" /> Merge inn i...
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm border rounded inline-flex items-center gap-1.5"
              onClick={() => router.push(`/contacts/${id}`)}
            >
              <X className="h-4 w-4" /> Avbryt
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground inline-flex items-center gap-1.5"
              onClick={save}
            >
              <Save className="h-4 w-4" /> Lagre
            </button>
          </div>
        </div>
      </div>

      {/* Merge Contacts Dialog */}
      {contact && contactCounts && (
        <MergeContactsDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          sourceContact={{
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
          }}
          contactCounts={contactCounts}
          onMerge={handleMerge}
        />
      )}

      <CompanyAffiliations contactId={id} history={history} onMutate={mutate} />
    </div>
  );
}
