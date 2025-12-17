# Leads Kanban Board

A drag-and-drop kanban board for managing lead statuses in the CRM.

## Overview

The kanban board provides a visual way to track leads through their lifecycle. Leads can be dragged between columns to update their status.

## Columns

- **Ny** (NEW) - New leads that haven't been worked on yet
- **Under arbeid** (IN_PROGRESS) - Leads currently being worked on
- **Satt på vent** (ON_HOLD) - Leads put on hold
- **Ferdig** - Finished leads, grouped by outcome:
  - Vunnet (WON) - Won deals
  - Tapt (LOST) - Lost deals
  - Bortfalt (BORTFALT) - Deals that fell through

## Components

### `KanbanBoard`

Main container component that orchestrates drag-and-drop and data fetching.

- Uses SWR to fetch leads from `/api/leads`
- Handles optimistic updates when dragging
- Groups leads by status
- Renders columns and the finished zone

### `KanbanColumn`

A single column displaying leads of a specific status.

- Uses `useDroppable` from @dnd-kit/core
- Shows lead count in header badge
- Highlights when a lead is dragged over

### `KanbanLeadCard`

Individual lead card displayed in columns.

- Uses `useDraggable` from @dnd-kit/core
- Shows company badge, description, potential value, and next followup
- Links to lead detail page
- Supports drag overlay rendering

### `KanbanFinishedZone`

Special zone for finished leads (WON, LOST, BORTFALT).

- Shows drop zones when dragging (expands to show targets)
- Shows stats and finished leads when not dragging
- Finished leads are draggable back to active columns

## Data Flow

```
/api/leads (GET)
    ↓
SWR Cache
    ↓
KanbanBoard (groups by status)
    ↓
KanbanColumn / KanbanFinishedZone
    ↓
KanbanLeadCard / FinishedLeadCard
```

When a lead is dragged:

1. `onDragEnd` fires with active (lead) and over (column) IDs
2. Optimistic update via SWR mutate
3. PATCH request to `/api/leads/[id]` with new status
4. Revalidate on error

## Card Layout

```
┌────────────────────────────────┐
│ [🏢 Company Name]              │
│                                │
│ Lead description...            │
│                                │
│ 💰 kr 500 000                  │
│ ─────────────────────────────  │
│ 📅✓ 15. des 2025         [👤]  │
└────────────────────────────────┘
```

## DnD Implementation

Uses [@dnd-kit/core](https://dndkit.com/) for drag-and-drop.

**Sensors:**
- `MouseSensor` with 8px distance constraint (prevents accidental drags)
- `TouchSensor` with 200ms delay and 5px tolerance (better mobile UX)

**Draggable IDs:** `lead-{id}` (e.g., `lead-123`)

**Droppable IDs:** `status-{STATUS}` (e.g., `status-NEW`, `status-WON`)

## Extending

### Adding a new column

1. Add the status to `LeadStatus` enum in schema
2. Add column config to `ACTIVE_COLUMNS` in `kanban-board.tsx`
3. Add status mapping in `getStatusFromDroppableId()`
4. Initialize the status array in `leadsByStatus`

### Modifying card design

Edit `kanban-lead-card.tsx`. The card content is defined in the `cardContent` variable and shared between normal and drag overlay renders.

## Files

- `kanban-board.tsx` - Main board component
- `kanban-column.tsx` - Column component
- `kanban-lead-card.tsx` - Lead card component
- `kanban-finished-zone.tsx` - Finished zone component

## Cosmos Fixtures

Fixtures are available at `cosmos/fixtures/components/kanban/`:
- `KanbanLeadCard.fixture.tsx`
- `KanbanColumn.fixture.tsx`
- `KanbanFinishedZone.fixture.tsx`
