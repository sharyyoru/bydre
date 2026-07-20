import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string; boardId: string }>;
}) {
  const { id, boardId } = await params;
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const { data: workspace } = isUuid
    ? await supabase.from("workspaces").select("*").eq("id", id).single()
    : await supabase.from("workspaces").select("*").eq("slug", id).single();

  const ws = workspace as { id: string; name: string } | null;
  if (!ws) notFound();

  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .eq("workspace_id", ws.id)
    .single();

  if (!board) notFound();

  return <CalendarView workspaceId={ws.id} board={board as any} />;
}
