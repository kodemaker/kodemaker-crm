"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CompanySelect, type CompanyOption } from "@/components/selects/company-select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type HistoryEntry = {
  id: number;
  startDate: string;
  endDate?: string | null;
  role?: string | null;
  company: { id: number; name: string };
};

type CompanyAffiliationsProps = {
  contactId: number;
  history: HistoryEntry[];
  onMutate: () => void;
};

export function CompanyAffiliations({
  contactId,
  history,
  onMutate,
}: CompanyAffiliationsProps) {
  // Find current position (no end date)
  const currentPosition = history.find((h) => !h.endDate);
  const previousPositions = history.filter((h) => h.endDate);

  // State for editing current position
  const [isEnding, setIsEnding] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyOption | null>(
    currentPosition ? { id: currentPosition.company.id, name: currentPosition.company.name } : null
  );
  const [editRole, setEditRole] = useState(currentPosition?.role || "");
  const [editStartDate, setEditStartDate] = useState<Date | null>(
    currentPosition?.startDate ? new Date(currentPosition.startDate) : null
  );
  const [editEndDate, setEditEndDate] = useState<Date | null>(new Date());

  // State for adding new position
  const [newCompany, setNewCompany] = useState<CompanyOption | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newStartDate, setNewStartDate] = useState<Date | null>(new Date());

  const [isSaving, setIsSaving] = useState(false);

  // Reset edit state when current position changes
  const resetEditState = () => {
    setIsEnding(false);
    setEditCompany(null);
    setEditRole("");
    setEditStartDate(null);
    setEditEndDate(new Date());
  };

  // Reset new position form
  const resetNewForm = () => {
    setNewCompany(null);
    setNewRole("");
    setNewStartDate(new Date());
  };

  async function handleEndPosition() {
    if (!currentPosition || !editEndDate) return;

    setIsSaving(true);
    try {
      // Update company and role if changed
      const updates: Record<string, unknown> = {
        endDate: editEndDate.toISOString().slice(0, 10),
      };

      if (editCompany && editCompany.id !== currentPosition.company.id) {
        updates.companyId = editCompany.id;
      }
      if (editRole !== (currentPosition.role || "")) {
        updates.role = editRole || null;
      }
      if (editStartDate) {
        const newStart = editStartDate.toISOString().slice(0, 10);
        if (newStart !== currentPosition.startDate) {
          updates.startDate = newStart;
        }
      }

      const res = await fetch(`/api/contact-company-history/${currentPosition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Kunne ikke avslutte stilling");
        return;
      }

      toast.success("Stilling avsluttet");
      resetEditState();
      onMutate();
    } catch (error) {
      console.error("Failed to end position:", error);
      toast.error("Kunne ikke avslutte stilling");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddPosition() {
    if (!newCompany || !newStartDate) {
      toast.error("Firma og startdato er påkrevd");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/contact-company-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          companyId: newCompany.id,
          role: newRole || null,
          startDate: newStartDate.toISOString().slice(0, 10),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Kunne ikke legge til stilling");
        return;
      }

      toast.success("Stilling lagt til");
      resetNewForm();
      onMutate();
    } catch (error) {
      console.error("Failed to add position:", error);
      toast.error("Kunne ikke legge til stilling");
    } finally {
      setIsSaving(false);
    }
  }

  // Format date range for display
  function formatDateRange(start: string, end?: string | null) {
    const startStr = formatDate(start);
    const endStr = end ? formatDate(end) : "nå";
    return `${startStr} – ${endStr}`;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Firmatilknytninger</h2>

      {/* Current Position */}
      {currentPosition && (
        <div className="border rounded-lg p-4 bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{currentPosition.company.name}</span>
                <Badge variant="secondary">Nåværende</Badge>
              </div>
              {!isEnding && (
                <div className="text-sm text-muted-foreground ml-6">
                  {currentPosition.role && <span>{currentPosition.role}</span>}
                  {currentPosition.role && currentPosition.startDate && <span> · </span>}
                  {currentPosition.startDate && (
                    <span>Fra {formatDate(currentPosition.startDate)}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sluttet</span>
              <Switch
                checked={isEnding}
                onCheckedChange={(checked) => {
                  setIsEnding(checked);
                  if (checked) {
                    // Prepopulate edit fields
                    setEditCompany({
                      id: currentPosition.company.id,
                      name: currentPosition.company.name,
                    });
                    setEditRole(currentPosition.role || "");
                    setEditStartDate(
                      currentPosition.startDate ? new Date(currentPosition.startDate) : null
                    );
                    setEditEndDate(new Date());
                  }
                }}
              />
            </div>
          </div>

          {/* Edit form when ending */}
          {isEnding && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Firma</label>
                  <CompanySelect
                    value={editCompany}
                    onChange={setEditCompany}
                    placeholder="Velg firma"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Rolle</label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Rolle"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Startdato</label>
                  <DatePicker
                    value={editStartDate}
                    onValueChange={(date) => setEditStartDate(date ?? null)}
                    placeholder="Velg dato"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Sluttdato</label>
                  <DatePicker
                    value={editEndDate}
                    onValueChange={(date) => setEditEndDate(date ?? null)}
                    placeholder="Velg dato"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnding(false)}
                  disabled={isSaving}
                >
                  Avbryt
                </Button>
                <Button size="sm" onClick={handleEndPosition} disabled={isSaving}>
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add new position form - shows when no current position */}
      {!currentPosition && (
        <div className="border rounded-lg p-4 border-dashed bg-background">
          <div className="text-sm font-medium mb-3">Legg til nåværende stilling</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Firma</label>
              <CompanySelect
                value={newCompany}
                onChange={setNewCompany}
                placeholder="Velg firma"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Rolle</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Rolle (valgfritt)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Startdato</label>
              <DatePicker
                value={newStartDate}
                onValueChange={(date) => setNewStartDate(date ?? null)}
                placeholder="Velg dato"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handleAddPosition} disabled={isSaving || !newCompany}>
              {isSaving ? "Lagrer..." : "Legg til"}
            </Button>
          </div>
        </div>
      )}

      {/* Previous positions - read-only list */}
      {previousPositions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground font-medium">
            Tidligere stillinger
          </div>
          <div className="border rounded-lg divide-y bg-background">
            {previousPositions.map((p) => (
              <div key={p.id} className="p-3 flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.company.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.role && <span>{p.role} · </span>}
                    {formatDateRange(p.startDate, p.endDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-sm text-muted-foreground">Ingen firmatilknytninger registrert.</div>
      )}
    </div>
  );
}
