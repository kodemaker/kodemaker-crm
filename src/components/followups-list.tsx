"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { FollowupItem as FollowupItemComponent } from "@/components/activity-log/followup-item";
import type { FollowupItemData } from "@/components/activity-log/followup-item";
import { EditFollowupDialog } from "@/components/dialogs/edit-followup-dialog";
import { SimplePagination } from "@/components/pagination/simple-pagination";
import { usePagination } from "@/hooks/use-pagination";

// Export type for backward compatibility
export type FollowupItem = FollowupItemData;

const FOLLOWUPS_PAGE_LIMIT = 5;

export function FollowupsList({
  endpoint,
  onCompleted,
  variant = "action",
}: {
  endpoint: string;
  onCompleted?: () => void;
  variant?: "action" | "completed";
}) {
  const {
    items: data,
    currentPage,
    totalPages,
    isLoading,
    setPage,
    mutate,
  } = usePagination<FollowupItemData>(endpoint, FOLLOWUPS_PAGE_LIMIT);
  const { mutate: globalMutate } = useSWRConfig();
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupItemData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Only show loading on initial load, not during pagination (keepPreviousData keeps old data visible)
  if (isLoading && data.length === 0) {
    return <div className="p-3 text-sm text-muted-foreground">Laster…</div>;
  }

  return (
    <>
      <div className="border rounded divide-y mt-3">
        {data.length ? (
          data.map((f) => (
            <FollowupItemComponent
              key={f.id}
              followup={f}
              variant={variant}
              showBadge={false}
              entityLinks={true}
              onComplete={
                variant === "action"
                  ? async (id: number) => {
                      const res = await fetch(`/api/followups/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          completedAt: new Date().toISOString(),
                        }),
                      });
                      if (res.ok) {
                        await mutate();
                        await globalMutate(
                          (key) => typeof key === "string" && key.startsWith("/api/followups")
                        );
                        onCompleted?.();
                      }
                    }
                  : undefined
              }
              onClick={() => {
                setSelectedFollowup(f);
                setEditDialogOpen(true);
              }}
            />
          ))
        ) : (
          <div className="p-3 text-sm text-muted-foreground">Ingen</div>
        )}
      </div>
      {data.length > 0 && totalPages > 1 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={isLoading}
          variant="compact"
        />
      )}
      <EditFollowupDialog
        followup={selectedFollowup}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedFollowup(null);
          } else {
            mutate();
            globalMutate((key) => typeof key === "string" && key.startsWith("/api/followups"));
          }
        }}
      />
    </>
  );
}
