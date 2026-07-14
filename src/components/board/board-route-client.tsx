"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { BoardView } from "./board-view"

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
  workspace_id: string
  default_view: string
}

type Workspace = {
  id: string
}

export function BoardRouteClient({
  workspaceIdentifier,
  boardId,
}: {
  workspaceIdentifier: string
  boardId: string
}) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadBoard = async () => {
      const supabase = createClient()
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .or(`id.eq.${workspaceIdentifier},slug.eq.${workspaceIdentifier}`)
        .maybeSingle()

      if (workspaceError || !workspaceData) {
        setError(true)
        return
      }

      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("id, name, type, workspace_id, default_view")
        .eq("id", boardId)
        .eq("workspace_id", workspaceData.id)
        .maybeSingle()

      if (boardError || !boardData) {
        setError(true)
        return
      }

      setWorkspace(workspaceData as Workspace)
      setBoard(boardData as Board)
    }

    loadBoard()
  }, [boardId, workspaceIdentifier])

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold text-[#0A1628]">Board unavailable</h1>
          <p className="text-sm text-muted-foreground">
            This board may have been removed or you may not have access.
          </p>
          <button
            className="text-sm font-medium text-[#D4AF37]"
            onClick={() => router.replace("/dashboard")}
          >
            Return to dashboard
          </button>
        </div>
      </main>
    )
  }

  if (!workspace || !board) {
    return <main className="min-h-screen bg-dre-surface" />
  }

  return <BoardView workspaceId={workspace.id} board={board} />
}
