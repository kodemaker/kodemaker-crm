"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactSelect, ContactOption } from "@/components/selects/contact-select";

type MergeContactsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceContact: {
    id: number;
    firstName: string;
    lastName: string;
  };
  contactCounts: {
    emailAddresses: number;
    emails: number;
    leads: number;
    comments: number;
    events: number;
    followups: number;
  };
  onMerge: (targetContactId: number) => Promise<void>;
};

export function MergeContactsDialog({
  open,
  onOpenChange,
  sourceContact,
  contactCounts,
  onMerge,
}: MergeContactsDialogProps) {
  const [selectedTargetContact, setSelectedTargetContact] = useState<ContactOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMerge = async () => {
    if (!selectedTargetContact) return;

    setIsLoading(true);
    try {
      await onMerge(selectedTargetContact.id);
      onOpenChange(false);
      setSelectedTargetContact(null);
    } catch (error) {
      console.error("Merge failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sourceFullName = `${sourceContact.firstName} ${sourceContact.lastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge kontakt</DialogTitle>
          <DialogDescription>
            Velg hvilken kontakt {sourceFullName} skal merges inn i. Under ser du hva som
            overføres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target contact selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Merge inn i kontakt</label>
            <ContactSelect
              value={selectedTargetContact}
              onChange={setSelectedTargetContact}
              allowCreate={false}
              excludeId={sourceContact.id}
              placeholder="Velg kontakt..."
            />
          </div>

          {/* Merge information list */}
          <div>
            <label className="block text-sm font-medium mb-2">Dette merges:</label>
            <ul className="space-y-1.5 text-sm list-disc list-inside">
              <li className={contactCounts.emailAddresses === 0 ? "text-muted-foreground" : ""}>
                E-postadresser ({contactCounts.emailAddresses})
              </li>
              <li className={contactCounts.emails === 0 ? "text-muted-foreground" : ""}>
                E-poster ({contactCounts.emails})
              </li>
              <li className={contactCounts.leads === 0 ? "text-muted-foreground" : ""}>
                Leads ({contactCounts.leads})
              </li>
              <li className={contactCounts.comments === 0 ? "text-muted-foreground" : ""}>
                Kommentarer ({contactCounts.comments})
              </li>
              <li className={contactCounts.events === 0 ? "text-muted-foreground" : ""}>
                Hendelser ({contactCounts.events})
              </li>
              <li className={contactCounts.followups === 0 ? "text-muted-foreground" : ""}>
                Oppgaver ({contactCounts.followups})
              </li>
            </ul>
          </div>

          {/* Delete source contact info */}
          <p className="text-sm text-muted-foreground">
            Kontakten {sourceFullName} vil bli slettet etter merge.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleMerge} disabled={!selectedTargetContact || isLoading}>
            {isLoading ? "Merger..." : "Merge kontakt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
