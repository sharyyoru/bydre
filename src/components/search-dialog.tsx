"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, FileText, LayoutGrid } from "lucide-react"

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [boards, setBoards] = useState<any[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>("drehomes")

  useEffect(() => {
    const supabase = createClient()
    const fetchWorkspace = async () => {
      const { data } = await supabase.from("workspaces").select("id, slug").limit(1).single()
      if (data) setWorkspaceId((data as { slug: string }).slug)
    }
    fetchWorkspace()
  }, [])

  useEffect(() => {
    if (!open || query.length < 2) {
      setItems([])
      setBoards([])
      return
    }
    const supabase = createClient()
    const search = async () => {
      const [{ data: itemData }, { data: boardData }] = await Promise.all([
        supabase
          .from("items")
          .select("id, title, board_id, boards(id, name, workspace_id, slug)")
          .ilike("title", `%${query}%`)
          .is("archived_at", null)
          .limit(10),
        supabase
          .from("boards")
          .select("id, name, type, workspace_id, slug")
          .ilike("name", `%${query}%`)
          .is("archived_at", null)
          .limit(10),
      ])
      setItems((itemData as any[]) || [])
      setBoards((boardData as any[]) || [])
    }
    search()
  }, [open, query])

  return (
    <>
      <div
        className="flex items-center gap-3 flex-1 max-w-md cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search boards, items, people..."
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          readOnly
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards, items..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {boards.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Boards</h4>
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/workspace/${workspaceId}/board/${board.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm font-medium">{board.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{board.type} board</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Items</h4>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/workspace/${workspaceId}/board/${item.board_id}?item=${item.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-[#0A1628]" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.boards?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {query.length >= 2 && boards.length === 0 && items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
