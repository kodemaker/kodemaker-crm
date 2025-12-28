"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { EmailItem } from "@/components/activity-log/email-item";
import { CommentItem } from "@/components/activity-log/comment-item";
import { FollowupItem } from "@/components/activity-log/followup-item";
import { LeadSelector } from "@/components/activity-log/lead-selector";
import { UserSelect, type UserOption } from "@/components/selects/user-select";
import { SimplePagination } from "@/components/pagination/simple-pagination";
import { usePagination } from "@/hooks/use-pagination";
import type { ApiRecentActivity, LeadStatus } from "@/types/api";
import { EditFollowupDialog } from "@/components/dialogs/edit-followup-dialog";
import { EditCommentDialog } from "@/components/dialogs/edit-comment-dialog";
import type { FollowupItemData } from "@/components/activity-log/followup-item";
import { getDefaultDueDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

type FollowupItemType = {
  id: number;
  note: string;
  dueAt: string;
  completedAt?: string | null;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  lead?: { id: number; description: string; status: LeadStatus } | null;
  contactEndDate?: string | null;
};

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  lead?: { id: number; description: string; status: LeadStatus } | null;
  contactEndDate?: string | null;
};

type ActivityLogProps = {
  leadId?: number;
  contactId?: number;
  contactName?: string;
  companyId?: number;
  companyName?: string;
  contactIds?: number[];
};

// Pagination limits as per requirements
const OPEN_FOLLOWUPS_LIMIT = 3;
const RECENT_ACTIVITIES_LIMIT = 7;


type Lead = {
  id: number;
  description: string;
  status: LeadStatus;
};

function buildQueryParams(
  leadId?: number,
  contactId?: number,
  companyId?: number,
  contactIds?: number[]
) {
  const followupParams = leadId
    ? `leadId=${leadId}&all=1`
    : contactId
      ? `contactId=${contactId}&all=1`
      : companyId
        ? `companyId=${companyId}&all=1`
        : "all=1";

  // Build recent activities endpoint params
  const recentActivitiesParams = leadId
    ? `leadId=${leadId}`
    : contactId
      ? `contactId=${contactId}`
      : companyId
        ? `companyId=${companyId}`
        : contactIds && contactIds.length > 0
          ? `contactIds=${contactIds.join(",")}`
          : null;

  return { followupParams, recentActivitiesParams };
}

export function ActivityLog({
  leadId,
  contactId,
  contactName,
  companyId,
  companyName,
  contactIds,
}: ActivityLogProps) {
  const [activeTab, setActiveTab] = useState<"followup" | "comment">("followup");
  const [newComment, setNewComment] = useState("");
  const [newFollowupNote, setNewFollowupNote] = useState("");
  const [newFollowupDue, setNewFollowupDue] = useState<Date | null>(getDefaultDueDate());
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [leadQuery, setLeadQuery] = useState("");
  const [editFollowupOpen, setEditFollowupOpen] = useState(false);
  const [editCommentOpen, setEditCommentOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupItemData | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const hasSetDefaultUser = useRef(false);

  const { followupParams, recentActivitiesParams } = buildQueryParams(
    leadId,
    contactId,
    companyId,
    contactIds
  );

  // "Krever handling" section - paginated open followups (limit 3)
  const {
    items: openFollowups,
    currentPage: openFollowupsPage,
    totalPages: openFollowupsTotalPages,
    isLoading: isLoadingOpenFollowups,
    setPage: setOpenFollowupsPage,
    mutate: mutateOpenFollowups,
  } = usePagination<FollowupItemType>(`/api/followups?${followupParams}`, OPEN_FOLLOWUPS_LIMIT);

  // "Siste nytt" section - unified recent activities endpoint
  const {
    items: recentActivities,
    currentPage: recentActivitiesPage,
    totalPages: recentActivitiesTotalPages,
    isLoading: isLoadingRecentActivities,
    setPage: setRecentActivitiesPage,
    mutate: mutateRecentActivities,
  } = usePagination<ApiRecentActivity>(
    recentActivitiesParams ? `/api/recent-activities?${recentActivitiesParams}` : null,
    RECENT_ACTIVITIES_LIMIT
  );

  const { data: users } = useSWR<UserOption[]>(`/api/users`);
  const { data: session } = useSession();

  // Don't fetch leads when already on a lead page (leadId provided)
  const leadsEndpoint = leadId
    ? null
    : contactId
      ? `/api/leads?contactId=${contactId}`
      : companyId
        ? `/api/leads?companyId=${companyId}`
        : null;
  const { data: leads } = useSWR<Lead[]>(leadsEndpoint);

  // Pre-select current user
  useEffect(() => {
    if (users && session?.user?.id && !selectedUser && !hasSetDefaultUser.current) {
      const currentUserId = Number(session.user.id);
      const currentUser = users.find((u) => u.id === currentUserId);
      if (currentUser) {
        setSelectedUser(currentUser);
        hasSetDefaultUser.current = true;
      }
    }
  }, [users, session?.user?.id, selectedUser]);

  async function saveComment() {
    const body = {
      content: newComment,
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(leadId ? { leadId } : selectedLead ? { leadId: selectedLead.id } : {}),
    };
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewComment("");
      setSelectedLead(null);
      await mutateRecentActivities();
    }
  }

  async function saveFollowup() {
    if (!newFollowupDue) return;
    const body = {
      note: newFollowupNote,
      dueAt: newFollowupDue.toISOString(),
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(selectedUser ? { assignedToUserId: selectedUser.id } : {}),
      ...(leadId ? { leadId } : selectedLead ? { leadId: selectedLead.id } : {}),
    };
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewFollowupNote("");
      setNewFollowupDue(getDefaultDueDate());
      setSelectedUser(null);
      setSelectedLead(null);
      await mutateOpenFollowups();
    }
  }

  async function completeFollowup(followupId: number) {
    const res = await fetch(`/api/followups/${followupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      await mutateOpenFollowups();
      await mutateRecentActivities();
    }
  }

  const filteredLeads = useMemo(() => {
    if (!leads || !leadQuery) return leads ?? [];
    const query = leadQuery.toLowerCase();
    return leads.filter((l) => l.description.toLowerCase().includes(query));
  }, [leads, leadQuery]);

  return (
    <section className="bg-muted rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Aktivitetslogg</h2>
      <div className="bg-background rounded p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followup" | "comment")}>
          <TabsList>
            <TabsTrigger value="followup">Oppgave</TabsTrigger>
            <TabsTrigger value="comment">Kommentar</TabsTrigger>
          </TabsList>
          <TabsContent value="followup" className="mt-4">
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Notat…"
                value={newFollowupNote}
                onChange={(e) => setNewFollowupNote(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="w-full sm:flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Frist</label>
                  <DatePicker
                    value={newFollowupDue}
                    onValueChange={(date) => setNewFollowupDue(date ?? null)}
                    placeholder="Velg dato"
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Tildel</label>
                  <UserSelect
                    value={selectedUser}
                    onChange={setSelectedUser}
                    placeholder="Velg bruker…"
                  />
                </div>
              </div>
              {leadsEndpoint && (
                <LeadSelector
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelect={setSelectedLead}
                  open={leadPopoverOpen}
                  onOpenChange={setLeadPopoverOpen}
                  query={leadQuery}
                  onQueryChange={setLeadQuery}
                  companyId={companyId}
                  companyName={companyName}
                  contactId={contactId}
                  contactName={contactName}
                  allowCreate
                />
              )}
              <div className="flex justify-end">
                <Button
                  onClick={saveFollowup}
                  disabled={!newFollowupNote.trim() || !newFollowupDue}
                >
                  Lagre oppgave
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="comment" className="mt-4">
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Skriv en kommentar…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              {leadsEndpoint && (
                <LeadSelector
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelect={setSelectedLead}
                  open={leadPopoverOpen}
                  onOpenChange={setLeadPopoverOpen}
                  query={leadQuery}
                  onQueryChange={setLeadQuery}
                  companyId={companyId}
                  companyName={companyName}
                  contactId={contactId}
                  contactName={contactName}
                  allowCreate
                />
              )}
              <div className="flex justify-end">
                <Button onClick={saveComment} disabled={!newComment.trim()}>
                  Lagre kommentar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 space-y-6">
        <div className="bg-background rounded p-4">
          <h3 className="text-sm font-medium mb-2">Krever handling:</h3>
          {isLoadingOpenFollowups && openFollowups.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Laster…</div>
          ) : openFollowups.length === 0 ? (
            <div className="border rounded p-3 text-sm text-muted-foreground">Ingen</div>
          ) : (
            <>
              <div className="border rounded divide-y">
                {openFollowups.map((f) => (
                  <FollowupItem
                    key={f.id}
                    followup={f}
                    variant="action"
                    onComplete={completeFollowup}
                    onClick={() => {
                      setSelectedFollowup(f);
                      setEditFollowupOpen(true);
                    }}
                  />
                ))}
              </div>
              <SimplePagination
                currentPage={openFollowupsPage}
                totalPages={openFollowupsTotalPages}
                onPageChange={setOpenFollowupsPage}
                variant="compact"
              />
            </>
          )}
        </div>

        <div className="bg-background rounded p-4">
          <h3 className="text-sm font-medium mb-2">Siste nytt:</h3>
          {isLoadingRecentActivities && recentActivities.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Laster...</div>
          ) : recentActivities.length === 0 ? (
            <div className="border rounded p-3 text-sm text-muted-foreground">Ingen</div>
          ) : (
            <>
              <div className="border rounded divide-y">
                {recentActivities.map((item) => {
                  if (item.type === "comment" && item.comment) {
                    return (
                      <CommentItem
                        key={item.id}
                        id={item.comment.id}
                        content={item.comment.content}
                        createdAt={item.createdAt}
                        createdBy={item.createdBy}
                        company={item.company}
                        contact={item.contact}
                        lead={item.lead}
                        contactEndDate={item.contactEndDate}
                        showTime={false}
                        onClick={() => {
                          setSelectedComment({
                            id: item.comment!.id,
                            content: item.comment!.content,
                            createdAt: item.createdAt,
                            createdBy: item.createdBy,
                            company: item.company,
                            contact: item.contact,
                            lead: item.lead,
                            contactEndDate: item.contactEndDate,
                          });
                          setEditCommentOpen(true);
                        }}
                      />
                    );
                  }

                  if (item.type === "followup" && item.followup) {
                    const followupData: FollowupItemType = {
                      id: item.followup.id,
                      note: item.followup.note,
                      dueAt: item.followup.dueAt,
                      completedAt: item.followup.completedAt,
                      createdAt: item.createdAt,
                      createdBy: item.createdBy,
                      assignedTo: item.followup.assignedTo,
                      company: item.company,
                      contact: item.contact,
                      lead: item.lead,
                      contactEndDate: item.contactEndDate,
                    };
                    return (
                      <FollowupItem
                        key={item.id}
                        followup={followupData}
                        variant="completed"
                        onClick={() => {
                          setSelectedFollowup(followupData);
                          setEditFollowupOpen(true);
                        }}
                      />
                    );
                  }

                  if (item.type === "email" && item.email) {
                    return (
                      <EmailItem
                        key={item.id}
                        email={{
                          id: item.email.id,
                          subject: item.email.subject,
                          content: item.email.content,
                          createdAt: item.createdAt,
                          sourceUser: item.createdBy,
                          recipientContact: item.contact,
                        }}
                      />
                    );
                  }

                  return null;
                })}
              </div>
              <SimplePagination
                currentPage={recentActivitiesPage}
                totalPages={recentActivitiesTotalPages}
                onPageChange={setRecentActivitiesPage}
                variant="compact"
              />
            </>
          )}
        </div>
      </div>

      <EditFollowupDialog
        followup={selectedFollowup}
        open={editFollowupOpen}
        onOpenChange={(open) => {
          setEditFollowupOpen(open);
          if (!open) {
            setSelectedFollowup(null);
          }
        }}
        onDelete={async () => {
          await mutateRecentActivities();
        }}
        onUpdate={async () => {
          await mutateRecentActivities();
        }}
      />

      <EditCommentDialog
        comment={selectedComment}
        open={editCommentOpen}
        onOpenChange={(open) => {
          setEditCommentOpen(open);
          if (!open) {
            setSelectedComment(null);
          }
        }}
        onDelete={async () => {
          await mutateRecentActivities();
        }}
        onUpdate={async () => {
          await mutateRecentActivities();
        }}
      />
    </section>
  );
}
