import { CreativeStudio } from "@/components/creative-studio/creative-studio"

export default async function CreativeStudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CreativeStudio workspaceId={id} />
}
