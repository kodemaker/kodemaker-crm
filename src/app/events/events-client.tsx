"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ActivityEventItem } from "@/components/hendelseslogg/activity-event-item";
import { EventFiltersBar, type EventFilters } from "@/components/filters/event-filters";
import { SimplePagination } from "@/components/pagination/simple-pagination";
import { usePagination } from "@/hooks/use-pagination";
import type { ApiActivityEvent } from "@/types/api";

const EVENTS_LIMIT = 10;

export function EventsClient() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  const [filters, setFilters] = useState<EventFilters>({
    types: [],
    companyId: undefined,
    contactId: undefined,
    userFilter: "all",
    fromDate: undefined,
    toDate: undefined,
  });

  // Build query string from filters (without pagination params - hook adds those)
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.types.length > 0) {
      params.set("type", filters.types.join(","));
    }
    if (filters.companyId) {
      params.set("companyId", String(filters.companyId));
    }
    if (filters.contactId) {
      params.set("contactId", String(filters.contactId));
    }
    // Handle user filter
    if (filters.userFilter === "mine" && currentUserId) {
      params.set("userId", String(currentUserId));
    } else if (filters.userFilter === "excludeMine" && currentUserId) {
      params.set("excludeUserId", String(currentUserId));
    } else if (typeof filters.userFilter === "number") {
      params.set("userId", String(filters.userFilter));
    }
    if (filters.fromDate) {
      params.set("fromDate", filters.fromDate.toISOString().split("T")[0]);
    }
    if (filters.toDate) {
      params.set("toDate", filters.toDate.toISOString().split("T")[0]);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters, currentUserId]);

  const {
    items: paginatedEvents,
    currentPage,
    totalPages,
    isLoading,
    setPage,
  } = usePagination<ApiActivityEvent>(`/api/activity-events${queryString}`, EVENTS_LIMIT);

  const [live, setLive] = useState<ApiActivityEvent[]>([]);
  const lastIdRef = useRef<number>(0);
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set());
  const [sseInitialized, setSseInitialized] = useState(false);

  // Combine data from API and live SSE events
  // Only include live events on page 1 - they should not appear on subsequent pages
  const items = useMemo(() => {
    // Ensure uniqueness by id; live first (newest at top), then paginated list
    const map = new Map<number, ApiActivityEvent>();
    if (currentPage === 1) {
      for (const e of live) map.set(e.id, e);
    }
    for (const e of paginatedEvents) if (!map.has(e.id)) map.set(e.id, e);

    // Filter live events based on current filters
    const arr = Array.from(map.values())
      .filter((e) => {
        // Filter by type
        if (filters.types.length > 0 && !filters.types.includes(e.eventType)) {
          return false;
        }
        // Filter by company
        if (filters.companyId && e.company?.id !== filters.companyId) {
          return false;
        }
        // Filter by contact
        if (filters.contactId && e.contact?.id !== filters.contactId) {
          return false;
        }
        // Filter by user
        if (filters.userFilter === "mine" && currentUserId && e.actorUser?.id !== currentUserId) {
          return false;
        }
        if (
          filters.userFilter === "excludeMine" &&
          currentUserId &&
          e.actorUser?.id === currentUserId
        ) {
          return false;
        }
        if (typeof filters.userFilter === "number" && e.actorUser?.id !== filters.userFilter) {
          return false;
        }
        // Date filters would need the full event data, which SSE provides raw
        // For simplicity, we'll let them through and rely on server filtering for date
        return true;
      })
      .sort((a, b) => b.id - a.id);

    return arr;
  }, [paginatedEvents, live, filters, currentUserId, currentPage]);

  // Track max ID from paginated data load
  useEffect(() => {
    if (paginatedEvents.length === 0) return;
    const maxId = paginatedEvents.reduce((m, e) => Math.max(m, e.id), 0);
    lastIdRef.current = Math.max(lastIdRef.current, maxId);
  }, [paginatedEvents]);

  // Clear live events and reset SSE when filters change
  useEffect(() => {
    setLive([]);
    setSseInitialized(false);
  }, [queryString]);

  // Initialize SSE once we have first data (not on every page change)
  useEffect(() => {
    if (!isLoading && !sseInitialized) {
      setSseInitialized(true);
    }
  }, [isLoading, sseInitialized]);

  // SSE connection for real-time updates - only depends on initialization and filters
  useEffect(() => {
    if (!sseInitialized) return;
    let es: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const since = lastIdRef.current || 0;
      es = new EventSource(`/api/activity-events/stream?since=${since}`);

      es.onmessage = (msg) => {
        try {
          const e = JSON.parse(msg.data) as ApiActivityEvent;
          lastIdRef.current = Math.max(lastIdRef.current, e.id);

          setLive((prev) => {
            if (prev.find((x) => x.id === e.id)) return prev;
            return [e, ...prev].slice(0, 100);
          });

          // Mark fresh for 10s to drive CSS transition
          setFreshIds((prev) => new Set(prev).add(e.id));
          setTimeout(() => {
            setFreshIds((prev) => {
              const next = new Set(prev);
              next.delete(e.id);
              return next;
            });
          }, 10000);
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        if (!cancelled) {
          // Backoff reconnect after small delay
          setTimeout(connect, 2000);
        }
        es?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [sseInitialized]);

  const handleFiltersChange = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold mb-4">Hendelseslogg</h1>
      </div>

      <EventFiltersBar filters={filters} onChange={handleFiltersChange} />

      <div className="flex-1 overflow-auto">
        <div className="border-t">
          {isLoading && items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Laster hendelser...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Ingen hendelser funnet</div>
          ) : (
            <>
              {items.map((e) => (
                <ActivityEventItem key={e.id} event={e} isNew={freshIds.has(e.id)} />
              ))}
              <div className="p-4">
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
