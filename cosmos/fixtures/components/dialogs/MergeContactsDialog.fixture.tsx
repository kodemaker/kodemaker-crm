import { MergeContactsDialog } from "@/components/merge-contacts-dialog";

const SOURCE_CONTACT = {
  id: 1,
  firstName: "Kari",
  lastName: "Nordmann",
};

const COUNTS_WITH_DATA = {
  emailAddresses: 2,
  emails: 5,
  leads: 1,
  comments: 3,
  events: 4,
  followups: 2,
};

const COUNTS_EMPTY = {
  emailAddresses: 0,
  emails: 0,
  leads: 0,
  comments: 0,
  events: 0,
  followups: 0,
};

const COUNTS_PARTIAL = {
  emailAddresses: 1,
  emails: 0,
  leads: 2,
  comments: 0,
  events: 1,
  followups: 0,
};

export default {
  "With data": (
    <MergeContactsDialog
      open={true}
      onOpenChange={() => {}}
      sourceContact={SOURCE_CONTACT}
      contactCounts={COUNTS_WITH_DATA}
      onMerge={async (targetContactId) => {
        console.log("Merging to contact:", targetContactId);
      }}
    />
  ),
  "Empty counts": (
    <MergeContactsDialog
      open={true}
      onOpenChange={() => {}}
      sourceContact={SOURCE_CONTACT}
      contactCounts={COUNTS_EMPTY}
      onMerge={async (targetContactId) => {
        console.log("Merging to contact:", targetContactId);
      }}
    />
  ),
  "Partial counts": (
    <MergeContactsDialog
      open={true}
      onOpenChange={() => {}}
      sourceContact={SOURCE_CONTACT}
      contactCounts={COUNTS_PARTIAL}
      onMerge={async (targetContactId) => {
        console.log("Merging to contact:", targetContactId);
      }}
    />
  ),
};
