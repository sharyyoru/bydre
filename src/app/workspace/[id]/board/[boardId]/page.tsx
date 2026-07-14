import { BoardRouteClient } from "@/components/board/board-route-client"

export default function BoardPage({
  params,
}: {
  params: { id: string; boardId: string }
}) {
  return (
    <BoardRouteClient
      workspaceIdentifier={params.id}
      boardId={params.boardId}
    />
  )
}
