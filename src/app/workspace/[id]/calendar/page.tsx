import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { WorkspaceCalendarView } from "@/components/calendar/workspace-calendar-view"

export default async function WorkspaceCalendarPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)
  const { data: workspace } = isUuid ? await supabase.from("workspaces").select("id,slug").eq("id", params.id).maybeSingle() : await supabase.from("workspaces").select("id,slug").eq("slug", params.id).maybeSingle()
  if (!workspace) notFound()
  return <WorkspaceCalendarView workspaceId={workspace.id} workspaceSlug={workspace.slug} />
}
