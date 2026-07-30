import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../_helpers"
import { signedSelfieUrl } from "@/lib/attendance/storage"

/**
 * GET — signed URL for a check-in/out selfie.
 * Query: workspace_id, record_id, which=in|out
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  const recordId = sp.get("record_id")
  const which = sp.get("which") === "out" ? "out" : "in"
  if (!workspaceId || !recordId) {
    return NextResponse.json({ error: "workspace_id and record_id required" }, { status: 400 })
  }

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data: record } = await supabase
    .from("attendance_records")
    .select("user_id, check_in_photo_path, check_out_photo_path")
    .eq("id", recordId)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 })

  if (auth.role !== "admin" && record.user_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const path = which === "out" ? record.check_out_photo_path : record.check_in_photo_path
  if (!path) return NextResponse.json({ error: "No photo" }, { status: 404 })

  const url = await signedSelfieUrl(path)
  if (!url) return NextResponse.json({ error: "Could not sign URL" }, { status: 500 })
  return NextResponse.json({ url })
}
