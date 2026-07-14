import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/board-view";

export default async function BoardPage({
  params,
}: {
  params: { id: string; boardId: string };
}) {
  const supabase = createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .single();

  const ws = workspace as { id: string; name: string } | null;
  if (!ws) notFound();

  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", params.boardId)
    .eq("workspace_id", ws.id)
    .single();

  if (!board) notFound();

  return <BoardView workspaceId={ws.id} board={board as any} />;
}
