"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Attendance } from "@/components/attendance/attendance"

export default function AttendancePage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <Attendance workspaceId={workspaceId} />
    </AppShell>
  )
}
