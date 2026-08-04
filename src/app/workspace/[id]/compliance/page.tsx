import { ComplianceHub } from "@/components/compliance/compliance-hub"

export default function CompliancePage({
  params,
}: {
  params: { id: string }
}) {
  return <ComplianceHub workspaceId={params.id} />
}
