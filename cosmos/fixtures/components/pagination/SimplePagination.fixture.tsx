import { SimplePagination } from "@/components/pagination/simple-pagination";
import { useState } from "react";

function InteractivePagination() {
  const [page, setPage] = useState(1);
  const totalPages = 5;

  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-4 text-sm text-muted-foreground">
        Simulerer paginering: Side {page} av {totalPages}
      </div>
      <SimplePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

function InteractiveCompact() {
  const [page, setPage] = useState(1);
  const totalPages = 3;

  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-4 text-sm text-muted-foreground">
        Kompakt variant: Side {page} av {totalPages}
      </div>
      <SimplePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        variant="compact"
      />
    </div>
  );
}

export default {
  default: (
    <SimplePagination
      currentPage={1}
      totalPages={5}
      onPageChange={() => {}}
    />
  ),
  middlePage: (
    <SimplePagination
      currentPage={3}
      totalPages={5}
      onPageChange={() => {}}
    />
  ),
  lastPage: (
    <SimplePagination
      currentPage={5}
      totalPages={5}
      onPageChange={() => {}}
    />
  ),
  loading: (
    <SimplePagination
      currentPage={2}
      totalPages={5}
      onPageChange={() => {}}
      isLoading={true}
    />
  ),
  singlePage: (
    <div className="p-4 border rounded-lg text-sm text-muted-foreground">
      Ensidet innhold (ingen paginering vises):
      <SimplePagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  ),
  compact: (
    <SimplePagination
      currentPage={2}
      totalPages={5}
      onPageChange={() => {}}
      variant="compact"
    />
  ),
  compactLoading: (
    <SimplePagination
      currentPage={2}
      totalPages={5}
      onPageChange={() => {}}
      variant="compact"
      isLoading={true}
    />
  ),
  interactive: <InteractivePagination />,
  interactiveCompact: <InteractiveCompact />,
};
