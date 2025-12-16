import { requireAuth } from "@/lib/require-auth";
import { KanbanBoard } from "@/components/kanban";

export default async function ActiveLeadsPage() {
  await requireAuth();
  return <KanbanBoard />;
}
