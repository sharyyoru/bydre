"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, FileText, LayoutGrid, UserRound } from "lucide-react"

type Board = { id: string; name: string; type: string }
type Item = { id: string; title: string; description: string | null; board_id: string }
type Person = { id: string; name: string; email: string }
type Update = { id: string; content: string; item_id: string; board_id: string; item_title: string }

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [workspaceSlug, setWorkspaceSlug] = useState("drehomes")
  const [boards, setBoards] = useState<Board[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setBoards([])
      setItems([])
      setPeople([])
      setUpdates([])
      setError("")
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      const supabase = createClient()
      const term = `%${query.trim()}%`
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id, slug")
        .limit(1)
        .maybeSingle()

      if (workspaceError || !workspace) {
        setError("Unable to load your workspace.")
        setLoading(false)
        return
      }

      setWorkspaceSlug(workspace.slug)
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("id, name, type")
        .eq("workspace_id", workspace.id)
        .is("archived_at", null)
        .ilike("name", term)
        .limit(10)

      const { data: allBoardData, error: allBoardsError } = await supabase
        .from("boards")
        .select("id")
        .eq("workspace_id", workspace.id)
        .is("archived_at", null)

      const boardIds = (allBoardData || []).map((board) => board.id)
      const [itemResult, memberResult] = await Promise.all([
        boardIds.length
          ? supabase
              .from("items")
              .select("id, title, description, board_id")
              .in("board_id", boardIds)
              .is("archived_at", null)
              .limit(1000)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("workspace_members")
          .select("user_id, profiles(id, email, full_name)")
          .eq("workspace_id", workspace.id),
      ])

      const normalizedQuery = query.trim().toLowerCase()
      const matchingPeople = ((memberResult.data || []) as any[])
        .map((member) => ({ id: member.user_id, name: member.profiles?.full_name || member.profiles?.email || "Unknown", email: member.profiles?.email || "" }))
        .filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 10)
      const matchingItems = ((itemResult.data || []) as Item[])
        .filter((item) => `${item.title} ${item.description || ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 20)

      setBoards((boardData as Board[]) || [])
      setItems(matchingItems)
      setPeople(matchingPeople)
      setUpdates([])
      if (boardError || allBoardsError || itemResult.error || memberResult.error) setError("Some results could not be loaded. Please try again.")
      setLoading(false)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [open, query])

  const hasResults = boards.length + items.length + people.length + updates.length > 0
  const close = () => setOpen(false)

  return <>
    <div className="flex items-center gap-3 flex-1 max-w-md cursor-pointer" onClick={() => setOpen(true)}>
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search boards, items, people..." className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0" readOnly />
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Search everything</DialogTitle></DialogHeader>
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search boards, items, people..." className="pl-9" autoFocus /></div>
        <p className="text-xs text-muted-foreground">Search across every board, item title, description, and workspace member you can access.</p>
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          {loading && <p className="py-5 text-center text-sm text-muted-foreground">Searching…</p>}
          {error && <p className="py-2 text-sm text-destructive">{error}</p>}
          {!loading && query.trim().length >= 2 && !hasResults && !error && <p className="py-5 text-center text-sm text-muted-foreground">No results found.</p>}
          <SearchSection title="Boards" entries={boards} render={(board) => <Link key={board.id} href={`/workspace/${workspaceSlug}/board/${board.id}`} onClick={close} className="search-result"><LayoutGrid className="h-4 w-4 text-[#D4AF37]" /><div><p>{board.name}</p><span>{board.type} board</span></div></Link>} />
          <SearchSection title="Items" entries={items} render={(item) => <Link key={item.id} href={`/workspace/${workspaceSlug}/board/${item.board_id}?item=${item.id}`} onClick={close} className="search-result"><FileText className="h-4 w-4 text-[#0A1628]" /><div><p>{item.title}</p>{item.description && <span>{item.description.replace(/<[^>]+>/g, " ").trim()}</span>}</div></Link>} />
          <SearchSection title="People" entries={people} render={(person) => <div key={person.id} className="search-result"><UserRound className="h-4 w-4 text-[#0A1628]" /><div><p>{person.name}</p><span>{person.email}</span></div></div>} />
        </div>
      </DialogContent>
    </Dialog>
  </>
}

function SearchSection<T>({ title, entries, render }: { title: string; entries: T[]; render: (entry: T) => React.ReactNode }) {
  if (!entries.length) return null
  return <section className="space-y-1"><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>{entries.map(render)}</section>
}
