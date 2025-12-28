import { MergeContactsDialog } from "@/components/merge-contacts-dialog";

const SOURCE_CONTACT = {
  id: 1,
  firstName: "Kari",
  lastName: "Nordmann",
};

const COUNTS = {
  emailAddresses: 2,
  emails: 5,
  leads: 1,
  comments: 3,
  events: 4,
  followups: 2,
};

export default (
  <MergeContactsDialog
    open={true}
    onOpenChange={() => {}}
    sourceContact={SOURCE_CONTACT}
    contactCounts={COUNTS}
    onMerge={async () => {}}
  />
);
