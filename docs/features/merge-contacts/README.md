# Merge Contacts

Merge duplicate contacts by transferring all data from a source contact to a target contact and deleting the source.

## Overview

The merge contacts feature allows users to consolidate duplicate contact records. When two contacts represent the same person (e.g., created from different email addresses), all associated data can be merged into a single contact record.

**Key behavior:**
- All data is always transferred (no selective merging)
- Source contact is always deleted after merge
- Merge is atomic (transaction-based)

## UI Flow

1. User navigates to contact edit page (`/contacts/[id]/edit`)
2. Clicks "Merge kontakt" button in the Danger Zone
3. Dialog opens showing:
   - Contact selector to choose target contact
   - List of data that will be transferred (with counts)
   - Information that source contact will be deleted
4. User selects target contact and clicks "Merge kontakt"
5. Success toast appears, user is redirected to contacts list

## API

### POST /api/contacts/[id]/merge

Merges source contact (from URL) into target contact.

**Request:**
```json
{
  "targetContactId": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully merged John Doe into Jane Smith"
}
```

**Error responses:**
- `400` - Invalid request (missing targetContactId, merging with self)
- `404` - Source or target contact not found
- `500` - Database error

## Database Operations

All operations happen in a single transaction:

1. **contact_emails** - Update `contactId` to target
2. **emails** - Update `recipientContactId` to target
3. **leads** - Update `contactId` to target
4. **comments** - Update `contactId` to target
5. **activity_events** - Update `contactId` to target
6. **followups** - Update `contactId` to target
7. **contacts** - Delete source contact

## Edge Cases

| Case | Behavior |
|------|----------|
| Merge contact with itself | Returns 400 error |
| Source contact not found | Returns 404 error |
| Target contact not found | Returns 404 error |
| Database error during merge | Transaction rolls back, returns 500 |
| Same name contacts | Both appear in dropdown, selection by ID |

## Files

| File | Purpose |
|------|---------|
| `src/components/merge-contacts-dialog.tsx` | Dialog UI component |
| `src/app/api/contacts/[id]/merge/route.ts` | API endpoint |
| `src/app/contacts/[id]/edit/page.tsx` | Edit page with merge button |
| `src/app/api/contacts/[id]/merge/route.test.ts` | API tests |
| `cosmos/fixtures/components/dialogs/MergeContactsDialog.fixture.tsx` | Cosmos fixture |

## Component Props

```typescript
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
```
