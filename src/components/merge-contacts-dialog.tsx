"use client";
import { useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListContactsItem } from "@/types/api";

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
  onMerge: (data: {
    targetContactId: number;
    mergeEmailAddresses: boolean;
    mergeEmails: boolean;
    mergeLeads: boolean;
    mergeComments: boolean;
    mergeEvents: boolean;
    mergeFollowups: boolean;
    deleteSourceContact: boolean;
  }) => Promise<void>;
};

export function MergeContactsDialog({
  open,
  onOpenChange,
  sourceContact,
  contactCounts,
  onMerge,
}: MergeContactsDialogProps) {
  const [targetContactOpen, setTargetContactOpen] = useState(false);
  const [targetContactQuery, setTargetContactQuery] = useState("");
  const [selectedTargetContact, setSelectedTargetContact] = useState<ListContactsItem | null>(null);

  const [mergeEmailAddresses, setMergeEmailAddresses] = useState(contactCounts.emailAddresses > 0);
  const [mergeEmails, setMergeEmails] = useState(contactCounts.emails > 0);
  const [mergeLeads, setMergeLeads] = useState(contactCounts.leads > 0);
  const [mergeComments, setMergeComments] = useState(contactCounts.comments > 0);
  const [mergeEvents, setMergeEvents] = useState(contactCounts.events > 0);
  const [mergeFollowups, setMergeFollowups] = useState(contactCounts.followups > 0);
  const [deleteSourceContact, setDeleteSourceContact] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const { data: contactOptions } = useSWR<ListContactsItem[]>(
    targetContactQuery ? `/api/contacts?q=${encodeURIComponent(targetContactQuery)}` : null
  );

  // Filter out the source contact from options
  const filteredContactOptions = contactOptions?.filter((c) => c.id !== sourceContact.id) || [];

  const handleMerge = async () => {
    if (!selectedTargetContact) return;

    setIsLoading(true);
    try {
      await onMerge({
        targetContactId: selectedTargetContact.id,
        mergeEmailAddresses,
        mergeEmails,
        mergeLeads,
        mergeComments,
        mergeEvents,
        mergeFollowups,
        deleteSourceContact,
      });
      onOpenChange(false);
      // Reset form
      setSelectedTargetContact(null);
      setTargetContactQuery("");
      setMergeEmailAddresses(contactCounts.emailAddresses > 0);
      setMergeEmails(contactCounts.emails > 0);
      setMergeLeads(contactCounts.leads > 0);
      setMergeComments(contactCounts.comments > 0);
      setMergeEvents(contactCounts.events > 0);
      setMergeFollowups(contactCounts.followups > 0);
      setDeleteSourceContact(false);
    } catch (error) {
      console.error("Merge failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge inn i...</DialogTitle>
          <DialogDescription>
            Velg hvilken kontakt {sourceContact.firstName} {sourceContact.lastName} skal merges inn
            i, og hva som skal overføres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target contact selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Merge inn i kontakt</label>
            <Popover open={targetContactOpen} onOpenChange={setTargetContactOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={targetContactOpen}
                  className="w-full justify-between"
                >
                  {selectedTargetContact
                    ? `${selectedTargetContact.firstName} ${selectedTargetContact.lastName}`
                    : "Velg kontakt..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Søk etter kontakt..."
                    value={targetContactQuery}
                    onValueChange={setTargetContactQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Ingen kontakter funnet.</CommandEmpty>
                    {filteredContactOptions.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={`${contact.firstName} ${contact.lastName}`}
                        onSelect={() => {
                          setSelectedTargetContact(contact);
                          setTargetContactOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTargetContact?.id === contact.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {contact.firstName} {contact.lastName}
                        {contact.company && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({contact.company.name})
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Merge options */}
          <div>
            <label className="block text-sm font-medium mb-2">Hva skal merges?</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeEmailAddresses}
                  onChange={(e) => setMergeEmailAddresses(e.target.checked)}
                  disabled={contactCounts.emailAddresses === 0}
                  className="rounded"
                />
                <span className={contactCounts.emailAddresses === 0 ? "text-muted-foreground" : ""}>
                  E-postadresser ({contactCounts.emailAddresses})
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeEmails}
                  onChange={(e) => setMergeEmails(e.target.checked)}
                  disabled={contactCounts.emails === 0}
                  className="rounded"
                />
                <span className={contactCounts.emails === 0 ? "text-muted-foreground" : ""}>
                  E-poster ({contactCounts.emails})
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeLeads}
                  onChange={(e) => setMergeLeads(e.target.checked)}
                  disabled={contactCounts.leads === 0}
                  className="rounded"
                />
                <span className={contactCounts.leads === 0 ? "text-muted-foreground" : ""}>
                  Leads ({contactCounts.leads})
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeComments}
                  onChange={(e) => setMergeComments(e.target.checked)}
                  disabled={contactCounts.comments === 0}
                  className="rounded"
                />
                <span className={contactCounts.comments === 0 ? "text-muted-foreground" : ""}>
                  Kommentarer ({contactCounts.comments})
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeEvents}
                  onChange={(e) => setMergeEvents(e.target.checked)}
                  disabled={contactCounts.events === 0}
                  className="rounded"
                />
                <span className={contactCounts.events === 0 ? "text-muted-foreground" : ""}>
                  Hendelser ({contactCounts.events})
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeFollowups}
                  onChange={(e) => setMergeFollowups(e.target.checked)}
                  disabled={contactCounts.followups === 0}
                  className="rounded"
                />
                <span className={contactCounts.followups === 0 ? "text-muted-foreground" : ""}>
                  Oppgaver ({contactCounts.followups})
                </span>
              </label>
            </div>
          </div>

          {/* Delete source contact option */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={deleteSourceContact}
                onChange={(e) => setDeleteSourceContact(e.target.checked)}
                className="rounded"
              />
              <span>Slett denne kontakten etter merging</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleMerge} disabled={!selectedTargetContact || isLoading}>
            {isLoading ? "Merger..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
