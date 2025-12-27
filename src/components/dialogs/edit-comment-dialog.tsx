"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSWRConfig } from "swr";

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
};

export interface EditCommentDialogProps {
  comment: CommentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void | Promise<void>;
  onUpdate?: () => void | Promise<void>;
}

export function EditCommentDialog({ comment, open, onOpenChange, onDelete, onUpdate }: EditCommentDialogProps) {
  const schema = z.object({
    content: z.string().min(1, "Innhold er påkrevd"),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: "",
    },
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    if (comment && open) {
      form.reset({
        content: comment.content,
      });
    }
  }, [comment, open, form]);

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!comment) return;

    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: values.content }),
    });

    if (!res.ok) {
      toast.error("Kunne ikke oppdatere kommentar");
      return;
    }

    toast.success("Kommentar oppdatert");
    // Invalidate all comment-related cache keys
    await globalMutate((key) => typeof key === "string" && key.startsWith("/api/comments"));
    // Refresh recent activities list
    if (onUpdate) {
      await onUpdate();
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!comment) return;

    if (!confirm("Er du sikker på at du vil slette denne kommentaren? Dette kan ikke angres.")) {
      return;
    }

    setIsDeleting(true);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Kunne ikke slette kommentar");
      setIsDeleting(false);
      return;
    }

    toast.success("Kommentar slettet");
    // Invalidate all comment-related cache keys
    await globalMutate((key) => typeof key === "string" && key.startsWith("/api/comments"));
    // Refresh recent activities list
    if (onDelete) {
      await onDelete();
    }
    setIsDeleting(false);
    onOpenChange(false);
  }

  if (!comment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger kommentar</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Innhold</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      className="resize-none max-h-[40vh] overflow-auto"
                      placeholder="Kommentar..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-2 mt-6">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Slett
              </Button>
              <Button type="submit" className="inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Lagre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
