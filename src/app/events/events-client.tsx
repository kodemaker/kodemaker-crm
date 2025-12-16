"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { ActivityEventItem } from "@/components/hendelseslogg/activity-event-item";
import { EventFiltersBar, type EventFilters } from "@/components/hendelseslogg/event-filters";
import type { ApiActivityEvent, GetActivityEventsResponse } from "@/types/api";

export function EventsClient() {
  const [filters, setFilters] = useState<EventFilters>({
    types: [],
    companyId: undefined,
    contactId: undefined,
    userId: undefined,
    fromDate: undefined,
    toDate: undefined,
  });

  // Build query string from filters
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
    if (filters.userId) {
      params.set("userId", String(filters.userId));
    }
    if (filters.fromDate) {
      params.set("fromDate", filters.fromDate.toISOString().split("T")[0]);
    }
    if (filters.toDate) {
      params.set("toDate", filters.toDate.toISOString().split("T")[0]);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters]);

  const { data, isLoading } = useSWR<GetActivityEventsResponse>(
    `/api/activity-events${queryString}`
  );

  const [live, setLive] = useState<ApiActivityEvent[]>([]);
  const lastIdRef = useRef<number>(0);
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set());

  // Combine data from API and live SSE events
  const items = useMemo(() => {
    const base = data?.events || [];
    // Ensure uniqueness by id; live first (newest at top), then base list
    const map = new Map<number, ApiActivityEvent>();
    for (const e of live) map.set(e.id, e);
    for (const e of base) if (!map.has(e.id)) map.set(e.id, e);

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
        if (filters.userId && e.actorUser?.id !== filters.userId) {
          return false;
        }
        // Date filters would need the full event data, which SSE provides raw
        // For simplicity, we'll let them through and rely on server filtering for date
        return true;
      })
      .sort((a, b) => b.id - a.id);

    return arr;
  }, [data, live, filters]);

  // Track max ID from initial data load
  useEffect(() => {
    if (!data?.events) return;
    const maxId = data.events.reduce((m, e) => Math.max(m, e.id), 0);
    lastIdRef.current = Math.max(lastIdRef.current, maxId);
  }, [data]);

  // Clear live events when filters change
  useEffect(() => {
    setLive([]);
  }, [queryString]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (data === undefined) return;
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
  }, [data]);

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
          {isLoading && !data ? (
            <div className="p-6 text-center text-muted-foreground">Laster hendelser...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Ingen hendelser funnet</div>
          ) : (
            items.map((e) => (
              <ActivityEventItem key={e.id} event={e} isNew={freshIds.has(e.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
