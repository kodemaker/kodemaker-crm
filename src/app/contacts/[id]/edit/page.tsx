"use client";
import useSWR, { useSWRConfig } from "swr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { GitMerge, Plus, Save, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MergeContactsDialog } from "@/components/merge-contacts-dialog";
import { CompanyAffiliations } from "@/components/company-affiliations";
import { toast } from "sonner";

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
    try {
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
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Kunne ikke lagre kontakt");
        return;
      }
      toast.success("Kontakt lagret");
      await mutate();
      router.push(`/contacts/${id}`);
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast.error("Kunne ikke lagre kontakt");
    }
  }

  async function addEmail() {
    if (!newEmailAddress.trim()) return;

    try {
      const res = await fetch(`/api/contacts/${id}/emails`, {
        method: "POST",
        body: JSON.stringify({ email: newEmailAddress.trim(), active: true }),
      });

      if (res.ok) {
        setNewEmailAddress("");
        toast.success("E-postadresse lagt til");
        await mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "Kunne ikke legge til e-postadresse");
      }
    } catch (error) {
      console.error("Failed to add email:", error);
      toast.error("Kunne ikke legge til e-postadresse");
    }
  }

  async function updateEmail(emailId: number, email: string, active: boolean) {
    try {
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
        toast.error(error.error || "Kunne ikke oppdatere e-postadresse");
      }
    } catch (error) {
      console.error("Failed to update email:", error);
      toast.error("Kunne ikke oppdatere e-postadresse");
    }
  }

  async function deleteEmail(emailId: number) {
    if (!confirm("Slette denne e-postadressen?")) return;

    try {
      const res = await fetch(`/api/contacts/${id}/emails/${emailId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("E-postadresse slettet");
        await mutate();
      } else {
        const error = await res.json();
        toast.error(error.error || "Kunne ikke slette e-postadresse");
      }
    } catch (error) {
      console.error("Failed to delete email:", error);
      toast.error("Kunne ikke slette e-postadresse");
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
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
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

      <h1 className="text-2xl font-semibold">Endre kontakt</h1>

      {/* Section 1: Personal Information */}
      <section className="bg-secondary rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-semibold">Personlig informasjon</h2>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fornavn</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Etternavn</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Telefon</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">LinkedIn</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={linkedInUrl ?? ""}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Beskrivelse</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-y"
              rows={3}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notater om kontakten..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
              onClick={save}
            >
              <Save className="h-4 w-4" /> Lagre
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Email Addresses */}
      <section className="bg-secondary rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-semibold">E-postadresser</h2>
        <div className="space-y-2">
          {emails.map((emailItem) => (
            <div
              key={emailItem.id}
              className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${
                !emailItem.active ? "opacity-60" : ""
              }`}
            >
              {editingEmailId === emailItem.id ? (
                <input
                  className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
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
                  onBlur={() => {
                    if (editingEmailAddress !== emailItem.email) {
                      updateEmail(emailItem.id, editingEmailAddress, emailItem.active);
                    } else {
                      setEditingEmailId(null);
                      setEditingEmailAddress("");
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className={`flex-1 text-sm cursor-pointer hover:text-primary ${
                    !emailItem.active ? "text-muted-foreground line-through" : ""
                  }`}
                  onClick={() => {
                    setEditingEmailId(emailItem.id);
                    setEditingEmailAddress(emailItem.email);
                  }}
                  title="Klikk for å redigere"
                >
                  {emailItem.email}
                </span>
              )}
              <div className="flex items-center gap-3">
                <Switch
                  checked={emailItem.active}
                  onCheckedChange={(checked) =>
                    updateEmail(
                      emailItem.id,
                      editingEmailId === emailItem.id ? editingEmailAddress : emailItem.email,
                      checked
                    )
                  }
                />
                <button
                  onClick={() => deleteEmail(emailItem.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Slett"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
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
              className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Legg til
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Company Affiliations */}
      <section className="bg-secondary rounded-lg p-5">
        <CompanyAffiliations contactId={id} history={history} onMutate={mutate} />
      </section>

      {/* Danger Zone Actions */}
      <div className="flex gap-2 pt-2">
        <button
          className="px-3 py-2 text-sm rounded-md bg-destructive text-white hover:bg-destructive/90 inline-flex items-center gap-1.5"
          onClick={async () => {
            if (!confirm("Slette kontakt? Kommentarer, oppfølginger, e-poster og hendelser knyttet til denne kontakten vil også bli slettet. Dette kan ikke angres.")) return;
            const res = await fetch(`/api/contacts/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              await Promise.all([
                globalMutate((key) => typeof key === "string" && key.startsWith("/api/contacts")),
                currentCompany && globalMutate(`/api/companies/${currentCompany.id}`),
              ]);
              router.push(currentCompany ? `/customers/${currentCompany.id}` : "/contacts");
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> Slett kontakt
        </button>
        <button
          className="px-3 py-2 text-sm rounded-md bg-tertiary text-white hover:bg-tertiary/90 inline-flex items-center gap-1.5"
          onClick={() => setMergeDialogOpen(true)}
        >
          <GitMerge className="h-4 w-4" /> Merge inn i...
        </button>
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
    </div>
  );
}
