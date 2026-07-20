import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { WorkspaceCalendarView } from "@/components/calendar/workspace-calendar-view"

export default async function WorkspaceCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  const { data: workspace } = isUuid ? await supabase.from("workspaces").select("id,slug").eq("id", id).maybeSingle() : await supabase.from("workspaces").select("id,slug").eq("slug", id).maybeSingle()
  if (!workspace) notFound()
  return <WorkspaceCalendarView workspaceId={workspace.id} workspaceSlug={workspace.slug} />
}
