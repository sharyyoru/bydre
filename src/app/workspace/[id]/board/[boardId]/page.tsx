import { BoardRouteClient } from "@/components/board/board-route-client"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string; boardId: string }>
}) {
  const { id, boardId } = await params
  return (
    <BoardRouteClient
      workspaceIdentifier={id}
      boardId={boardId}
    />
  )
}
