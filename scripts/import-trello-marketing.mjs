import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import { readFile } from "fs/promises"
import path from "path"

const sourcePath = path.resolve(process.cwd(), "public/KF0bUvqQ - team-marketing.json")
const commit = process.argv.includes("--commit")
const workspaceArg = process.argv.find((arg) => arg.startsWith("--workspace="))?.split("=")[1]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey || !workspaceArg) {
  console.error("Usage: npm run import:trello -- --workspace=<workspace slug or id> [--commit]")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const aliases = { ali: ["ali"], sarmadrazzq: ["sarmad", "sarmadrazzq"], sarmadrazaq: ["sarmad", "sarmadrazaq"], shabil: ["shabil"], hamdan: ["hamdan"], abuthahir: ["abuthahir", "abutahir"], syedwaqas: ["syedwaqas", "waqas"], mannchavan: ["mannchavan", "mann"] }

const { data: sourceText } = await (async () => ({ data: await readFile(sourcePath, "utf8") }))()
const source = JSON.parse(sourceText)
const checksum = createHash("sha256").update(sourceText).digest("hex")
const cards = source.cards || []
const lists = (source.lists || []).filter((list) => !list.closed)
const summary = { board: source.name, cards: cards.length, openCards: cards.filter((card) => !card.closed).length, closedCards: cards.filter((card) => card.closed).length, lists: lists.length, labels: (source.labels || []).length, descriptions: cards.filter((card) => card.desc).length, datedCards: cards.filter((card) => card.due).length }

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceArg)
const workspaceQuery = supabase.from("workspaces").select("id,name,slug")
const { data: workspace, error: workspaceError } = isUuid
  ? await workspaceQuery.eq("id", workspaceArg).maybeSingle()
  : await workspaceQuery.eq("slug", workspaceArg).maybeSingle()
if (workspaceError || !workspace) throw new Error(`Workspace not found: ${workspaceArg}`)
const { data: profiles } = await supabase.from("workspace_members").select("user_id, profiles(id,email,full_name)").eq("workspace_id", workspace.id)
const memberByAlias = new Map()
for (const row of profiles || []) {
  const profile = row.profiles
  if (!profile) continue
  for (const candidate of [profile.full_name, profile.email?.split("@")[0]]) memberByAlias.set(normalize(candidate), profile)
}
const resolveOwner = (listName) => {
  const key = normalize(listName)
  for (const candidate of aliases[key] || [key]) if (memberByAlias.has(candidate)) return memberByAlias.get(candidate)
  return null
}
const unmatchedLists = lists.filter((list) => list.name !== "ASSIGN TASKS" && !resolveOwner(list.name)).map((list) => list.name)
console.log(JSON.stringify({ dryRun: !commit, workspace: workspace.name, ...summary, unmatchedLists }, null, 2))
if (!commit) process.exit(0)

const sourceSystem = "trello-team-marketing"
const { data: existingMap } = await supabase.from("import_entity_map").select("entity_id").eq("source_system", sourceSystem).eq("source_id", source.id).eq("entity_type", "board").maybeSingle()
let boardId = existingMap?.entity_id
const { data: admin } = await supabase.from("workspace_members").select("user_id").eq("workspace_id", workspace.id).eq("role", "admin").limit(1).maybeSingle()
if (!admin) throw new Error("Target workspace has no admin to attribute imported items")
const { data: run, error: runError } = await supabase.from("import_runs").insert({ workspace_id: workspace.id, source_system: sourceSystem, source_checksum: checksum, status: "running", summary, created_by: admin.user_id }).select("id").single()
if (runError) throw runError
try {
  if (!boardId) {
    const { data: board, error } = await supabase.from("boards").insert({ workspace_id: workspace.id, name: source.name, type: "tasks", position: 999 }).select("id").single()
    if (error) throw error
    boardId = board.id
    await supabase.from("import_entity_map").insert({ source_system: sourceSystem, source_id: source.id, entity_type: "board", entity_id: boardId, import_run_id: run.id, source_checksum: checksum })
    const columns = [
      { name: "Status", type: "status", position: 0, settings: { options: [{ id: "not-started", name: "Not started", color: "#6B7280", position: 0 }, { id: "in-progress", name: "In progress", color: "#3B82F6", position: 1 }, { id: "done", name: "Done", color: "#10B981", position: 2 }] } },
      { name: "Trello Labels", type: "dropdown", position: 1, settings: { multi_select: true, options: (source.labels || []).filter((label) => label.name).map((label, position) => ({ id: label.id, name: label.name, color: label.color || "#6B7280", position })) } },
      { name: "Due Date", type: "date", position: 2, settings: {} },
      { name: "Owner", type: "people", position: 3, settings: {} },
    ]
    const { error: columnsError } = await supabase.from("columns").insert(columns.map((column) => ({ ...column, board_id: boardId })))
    if (columnsError) throw columnsError
  }
  const { data: boardColumns, error: boardColumnsError } = await supabase.from("columns").select("id,name").eq("board_id", boardId)
  if (boardColumnsError) throw boardColumnsError
  const columnByName = Object.fromEntries((boardColumns || []).map((column) => [column.name, column.id]))
  for (const [position, list] of lists.entries()) {
    let groupId
    const { data: groupMap } = await supabase.from("import_entity_map").select("entity_id").eq("source_system", sourceSystem).eq("source_id", list.id).eq("entity_type", "group").maybeSingle()
    groupId = groupMap?.entity_id
    if (!groupId) {
      const { data: group, error } = await supabase.from("groups").insert({ board_id: boardId, name: list.name, position, color: "#D4AF37" }).select("id").single()
      if (error) throw error
      groupId = group.id
      await supabase.from("import_entity_map").insert({ source_system: sourceSystem, source_id: list.id, entity_type: "group", entity_id: groupId, import_run_id: run.id, source_checksum: checksum })
    }
    const owner = resolveOwner(list.name)
    if (!owner && list.name !== "ASSIGN TASKS") await supabase.from("import_assignment_review").upsert({ import_run_id: run.id, source_name: list.name }, { onConflict: "import_run_id,source_name" })
    const listCards = cards.filter((card) => card.idList === list.id)
    for (const [cardPosition, card] of listCards.entries()) {
      const { data: cardMap } = await supabase.from("import_entity_map").select("entity_id").eq("source_system", sourceSystem).eq("source_id", card.id).eq("entity_type", "item").maybeSingle()
      if (cardMap) continue
      const itemPayload = { board_id: boardId, group_id: groupId, title: card.name, description: card.desc || null, type: "task", priority: "medium", due_date: card.due ? card.due.slice(0, 10) : null, created_by: admin.user_id, position: cardPosition, archived_at: card.closed ? new Date().toISOString() : null, metadata: { import: { source: "trello", cardId: card.id, shortUrl: card.shortUrl, url: card.url, createdAt: card.dateLastActivity, labels: card.idLabels, attachments: card.attachments || [] } } }
      const { data: item, error } = await supabase.from("items").insert(itemPayload).select("id").single()
      if (error) throw error
      await supabase.from("import_entity_map").insert({ source_system: sourceSystem, source_id: card.id, entity_type: "item", entity_id: item.id, import_run_id: run.id, source_checksum: checksum })
      const values = []
      if (columnByName.Status) values.push({ item_id: item.id, column_id: columnByName.Status, value: card.closed || (card.labels || []).some((label) => /complete task/i.test(label.name || "")) ? "done" : (card.labels || []).some((label) => /on going/i.test(label.name || "")) ? "in-progress" : "not-started" })
      if (columnByName["Trello Labels"] && card.idLabels?.length) values.push({ item_id: item.id, column_id: columnByName["Trello Labels"], value: card.idLabels })
      if (columnByName["Due Date"] && card.due) values.push({ item_id: item.id, column_id: columnByName["Due Date"], value: card.due.slice(0, 10) })
      if (values.length) { const { error: valueError } = await supabase.from("item_values").insert(values); if (valueError) throw valueError }
      if (owner) { const { error: assigneeError } = await supabase.from("item_assignees").insert({ item_id: item.id, user_id: owner.id }); if (assigneeError) throw assigneeError }
    }
  }
  await supabase.from("import_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id)
  console.log(`Imported ${summary.cards} cards into ${source.name}`)
} catch (error) {
  await supabase.from("import_runs").update({ status: "failed", summary: { ...summary, error: error.message } }).eq("id", run.id)
  throw error
}
