import { createClient } from "@supabase/supabase-js"

const workspaceArg = process.argv.find((arg) => arg.startsWith("--workspace="))?.split("=")[1]
const commit = process.argv.includes("--commit")
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey || !workspaceArg) {
  console.error("Usage: npm run reassign:marketing -- --workspace=<workspace slug or id> [--commit]")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceArg)
const { data: workspace, error: workspaceError } = isUuid
  ? await supabase.from("workspaces").select("id,name").eq("id", workspaceArg).maybeSingle()
  : await supabase.from("workspaces").select("id,name").eq("slug", workspaceArg).maybeSingle()
if (workspaceError || !workspace) throw new Error(`Workspace not found: ${workspaceArg}`)

const routes = [
  { source: "MANN CHAVAN", board: "Content Calendar", group: "Ideas", user: "mann@drehomes.com" },
  { source: "HAMDAN", board: "Shoots", group: "Pre-Production", user: "hamdan@drehomes.com" },
  { source: "SARMAD RAZZAQ", board: "Shoots", group: "Pre-Production", user: "photoshoot@drehomes.com" },
  { source: "ALI", board: "Tasks", group: "Backlog", user: "marketing@drehomes.com" },
  { source: "ABUTHAHIR", board: "Tasks", group: "Backlog", user: "abu@drehomes.com" },
]

const [{ data: boards, error: boardsError }, { data: memberships, error: membersError }] = await Promise.all([
  supabase.from("boards").select("id,name").eq("workspace_id", workspace.id),
  supabase.from("workspace_members").select("user_id,profiles(email)").eq("workspace_id", workspace.id),
])
if (boardsError || membersError) throw boardsError || membersError
const boardByName = new Map((boards || []).map((board) => [board.name, board]))
const teamBoard = boardByName.get("TEAM MARKETING")
if (!teamBoard) throw new Error("TEAM MARKETING board was not found in this workspace")
const { data: groups, error: groupsError } = await supabase.from("groups").select("id,board_id,name").in("board_id", (boards || []).map((board) => board.id)).is("archived_at", null)
if (groupsError) throw groupsError
const memberByEmail = new Map((memberships || []).map((membership) => [membership.profiles?.email, membership.user_id]))
const groupByBoardAndName = new Map((groups || []).map((group) => [`${group.board_id}:${group.name}`, group]))
const executionPlan = routes.map((route) => {
  const sourceGroup = groupByBoardAndName.get(`${teamBoard.id}:${route.source}`)
  const targetBoard = boardByName.get(route.board)
  const targetGroup = targetBoard && groupByBoardAndName.get(`${targetBoard.id}:${route.group}`)
  const userId = memberByEmail.get(route.user)
  if (!sourceGroup || !targetBoard || !targetGroup || !userId) throw new Error(`Invalid route: ${route.source} → ${route.board}/${route.group} (${route.user})`)
  return { ...route, sourceGroupId: sourceGroup.id, targetBoardId: targetBoard.id, targetGroupId: targetGroup.id, userId }
})

const sourceGroupIds = executionPlan.map((route) => route.sourceGroupId)
const { data: sourceItems, error: itemsError } = await supabase.from("items").select("id,group_id,parent_id").eq("board_id", teamBoard.id).in("group_id", sourceGroupIds).is("archived_at", null)
if (itemsError) throw itemsError
const itemsByGroup = new Map(sourceGroupIds.map((id) => [id, []]))
for (const item of sourceItems || []) itemsByGroup.get(item.group_id)?.push(item)
const report = executionPlan.map((route) => ({ source: route.source, destination: `${route.board} / ${route.group}`, user: route.user, count: itemsByGroup.get(route.sourceGroupId)?.length || 0 }))
console.log(JSON.stringify({ dryRun: !commit, workspace: workspace.name, total: report.reduce((sum, row) => sum + row.count, 0), routes: report, excluded: ["SHABIL", "SYED WAQAS", "ASSIGN TASKS", "archived cards"] }, null, 2))
if (!commit) process.exit(0)

for (const route of executionPlan) {
  const itemIds = (itemsByGroup.get(route.sourceGroupId) || []).map((item) => item.id)
  if (!itemIds.length) continue
  const { error: moveError } = await supabase.from("items").update({ board_id: route.targetBoardId, group_id: route.targetGroupId }).in("id", itemIds)
  if (moveError) throw new Error(`${route.source}: ${moveError.message}`)
  const { error: removeAssigneesError } = await supabase.from("item_assignees").delete().in("item_id", itemIds)
  if (removeAssigneesError) throw new Error(`${route.source}: ${removeAssigneesError.message}`)
  const assignments = itemIds.map((item_id) => ({ item_id, user_id: route.userId }))
  const { error: assignError } = await supabase.from("item_assignees").insert(assignments)
  if (assignError) throw new Error(`${route.source}: ${assignError.message}`)
}
console.log(`Moved ${report.reduce((sum, row) => sum + row.count, 0)} active tasks.`)
