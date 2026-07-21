"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Check, X, Send, FileText } from "lucide-react"
import { ContentBrief, BriefStatus, PlatformCopy } from "@/lib/social-monitor/types"

const COLUMNS: { status: BriefStatus; label: string; color: string }[] = [
  { status: "pending_review", label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  { status: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { status: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  { status: "published", label: "Published", color: "bg-purple-100 text-purple-700" },
  { status: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
]

const PLATFORMS = ["instagram", "tiktok", "youtube", "x", "linkedin"] as const

export function ContentPipeline({ workspaceId }: { workspaceId: string }) {
  const [briefs, setBriefs] = useState<ContentBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContentBrief | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    setBriefs((data || []) as ContentBrief[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const updateBrief = async (id: string, updates: Partial<ContentBrief>) => {
    setSaving(true)
    const res = await fetch("/api/social-monitor/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id, ...updates }),
    })
    setSaving(false)
    if (res.ok) {
      const json = await res.json()
      setBriefs((list) => list.map((b) => (b.id === id ? json.brief : b)))
      if (selected?.id === id) setSelected(json.brief)
      return true
    }
    toast.error("Failed to update")
    return false
  }

  const setStatus = async (id: string, status: BriefStatus) => {
    const ok = await updateBrief(id, { status })
    if (ok) toast.success(`Marked ${status.replace("_", " ")}`)
  }

  const schedule = async (brief: ContentBrief, platform: string) => {
    const res = await fetch("/api/social-monitor/distribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, brief_id: brief.id, platform }),
    })
    if (res.ok) {
      toast.success(`Queued for ${platform}`)
      load()
    } else {
      toast.error("Failed to queue")
    }
  }

  const saveEdits = async () => {
    if (!selected) return
    await updateBrief(selected.id, {
      title: selected.title,
      hook: selected.hook,
      angle: selected.angle,
      summary: selected.summary,
      platform_copy: selected.platform_copy,
    })
    toast.success("Saved")
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : briefs.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>No content briefs yet. Generate briefs from the Arbitrage Engine tab.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = briefs.filter((b) => b.status === col.status)
            return (
              <div key={col.status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={`${col.color} border-0`}>{col.label}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.map((b) => (
                  <Card
                    key={b.id}
                    className="cursor-pointer rounded-xl border-border/60 transition-shadow hover:shadow-md"
                    onClick={() => setSelected(b)}
                  >
                    <CardContent className="space-y-2 p-3">
                      <p className="text-sm font-semibold text-[#0A1628] line-clamp-2">{b.title}</p>
                      {b.hook && <p className="text-xs text-muted-foreground line-clamp-2">{b.hook}</p>}
                      <div className="flex items-center justify-between">
                        {b.target_area && <span className="text-xs text-muted-foreground">{b.target_area}</span>}
                        {b.arbitrage_score != null && (
                          <span className="text-xs font-bold text-[#0A1628]">Score {b.arbitrage_score}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#0A1628]">Review brief</SheetTitle>
                <SheetDescription>Edit, approve, and schedule this content brief.</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-6">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setStatus(selected.id, "approved")} disabled={saving}>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setStatus(selected.id, "rejected")}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>

                <Field label="Title">
                  <Input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
                </Field>
                <Field label="Hook">
                  <Textarea value={selected.hook || ""} onChange={(e) => setSelected({ ...selected, hook: e.target.value })} />
                </Field>
                <Field label="Angle">
                  <Textarea value={selected.angle || ""} onChange={(e) => setSelected({ ...selected, angle: e.target.value })} />
                </Field>
                <Field label="Summary">
                  <Textarea value={selected.summary || ""} onChange={(e) => setSelected({ ...selected, summary: e.target.value })} />
                </Field>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Platform copy</p>
                  {PLATFORMS.map((p) => (
                    <Field key={p} label={p}>
                      <Textarea
                        value={(selected.platform_copy as PlatformCopy)?.[p] || ""}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            platform_copy: { ...selected.platform_copy, [p]: e.target.value },
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>

                <Button onClick={saveEdits} disabled={saving} className="w-full">
                  {saving ? "Saving…" : "Save changes"}
                </Button>

                <div className="rounded-xl border border-border/60 p-3">
                  <p className="mb-2 text-sm font-medium">Schedule to distribution</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <Button key={p} size="sm" variant="outline" onClick={() => schedule(selected, p)}>
                        <Send className="h-3 w-3 mr-1" />
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium capitalize">{label}</label>
      {children}
    </div>
  )
}
