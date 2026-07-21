import { createClient } from "@supabase/supabase-js"

/**
 * Reassigns all work/content from one user to another, and clears the source
 * user's personal state. Mirrors supabase/migrations/0027_reassign_mann_to_wilson.sql.
 *
 * Usage:
 *   node scripts/reassign-user.mjs --from=mann@drehomes.com --to=wilson@drehomes.com [--commit]
 *
 * Dry-run by default. Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

const commit = process.argv.includes("--commit")
const fromArg = process.argv.find((a) => a.startsWith("--from="))?.split("=")[1]
const toArg = process.argv.find((a) => a.startsWith("--to="))?.split("=")[1]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || !fromArg || !toArg) {
  console.error("Usage: node scripts/reassign-user.mjs --from=<email> --to=<email> [--commit]")
  process.exit(1)
}

const s = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: profiles, error: pErr } = await s.from("profiles").select("id,email,full_name").in("email", [fromArg, toArg])
if (pErr) throw pErr
const from = profiles.find((p) => p.email === fromArg)
const to = profiles.find((p) => p.email === toArg)
if (!to) throw new Error(`Target ${toArg} not found`)
if (!from) {
  console.log(`Source ${fromArg} not found; nothing to reassign.`)
  process.exit(0)
}
console.log(`Reassigning ${from.email} (${from.id}) -> ${to.email} (${to.id})  [${commit ? "COMMIT" : "dry-run"}]`)

const report = {}
const count = async (table, col) => {
  const { count } = await s.from(table).select("*", { count: "exact", head: true }).eq(col, from.id)
  return count || 0
}

// Simple attribution reassignments: UPDATE col = to WHERE col = from
const simpleReassign = [
  ["comments", "user_id"],
  ["items", "created_by"],
  ["items", "updated_by"],
  ["items", "last_activity_by"],
  ["activity_events", "actor_id"],
  ["attachments", "uploaded_by"],
  ["automations", "created_by"],
  ["board_views", "created_by"],
  ["import_runs", "created_by"],
  ["import_assignment_review", "suggested_user_id"],
]

// Personal state to delete (not transferable)
const deletions = [
  ["notifications", "user_id"],
  ["board_filters", "user_id"],
  ["board_user_preferences", "user_id"],
]

// Pre-count everything for the report
for (const [t, c] of [...simpleReassign, ...deletions, ["item_assignees", "user_id"], ["task_assignees", "user_id"], ["mentions", "mentioned_user_id"], ["workspace_members", "user_id"]]) {
  const n = await count(t, c).catch(() => "n/a")
  report[`${t}.${c}`] = n
}
console.log("Rows tied to source:\n" + JSON.stringify(report, null, 2))

if (!commit) {
  console.log("\nDry run only. Re-run with --commit to apply.")
  process.exit(0)
}

const run = async (label, fn) => {
  try {
    await fn()
    console.log(`✓ ${label}`)
  } catch (e) {
    console.warn(`⚠ ${label}: ${e.message}`)
  }
}

// Conflict-safe reassign for composite-key tables
const reassignWithConflict = async (table, keyCols) => {
  const cols = ["user_id", ...keyCols].join(",")
  const { data: toRows, error: tErr } = await s.from(table).select(cols).eq("user_id", to.id)
  if (tErr) throw tErr
  const { data: fromRows, error: fErr } = await s.from(table).select(cols).eq("user_id", from.id)
  if (fErr) throw fErr
  const keyOf = (row) => keyCols.map((k) => row[k]).join("|")
  const toKeys = new Set((toRows || []).map(keyOf))
  // Delete source rows that would collide with an existing target row (by key tuple).
  const collide = (fromRows || []).filter((r) => toKeys.has(keyOf(r)))
  for (const r of collide) {
    let q = s.from(table).delete().eq("user_id", from.id)
    for (const k of keyCols) q = q.eq(k, r[k])
    const { error } = await q
    if (error) throw error
  }
  const { error } = await s.from(table).update({ user_id: to.id }).eq("user_id", from.id)
  if (error) throw error
}

// item_assignees (PK item_id,user_id — no surrogate id)
await run("item_assignees", () => reassignWithConflict("item_assignees", ["item_id"]))
// task_assignees (UNIQUE item_id,user_id,role — has surrogate id)
await run("task_assignees", () => reassignWithConflict("task_assignees", ["item_id", "role"]))
// mentions (has surrogate id; unique per comment)
await run("mentions", () => reassignWithConflictMentions())
async function reassignWithConflictMentions() {
  const { data: toRows } = await s.from("mentions").select("comment_id").eq("mentioned_user_id", to.id)
  const toSet = new Set((toRows || []).map((r) => r.comment_id))
  const { data: fromRows } = await s.from("mentions").select("id, comment_id").eq("mentioned_user_id", from.id)
  const collide = (fromRows || []).filter((r) => toSet.has(r.comment_id)).map((r) => r.id)
  if (collide.length) await s.from("mentions").delete().in("id", collide)
  const { error } = await s.from("mentions").update({ mentioned_user_id: to.id }).eq("mentioned_user_id", from.id)
  if (error) throw error
}

// Simple reassignments
for (const [t, c] of simpleReassign) {
  await run(`${t}.${c}`, async () => {
    const { error } = await s.from(t).update({ [c]: to.id }).eq(c, from.id)
    if (error) throw error
  })
}

// Rewrite Mann's id/name inside comment mention markup
await run("comments.content mention rewrite", async () => {
  const { data: rows } = await s.from("comments").select("id, content").or(`content.ilike.%${from.id}%,content.ilike.%${from.full_name || "\u0000"}%`)
  for (const row of rows || []) {
    let next = row.content.split(from.id).join(to.id)
    if (from.full_name && to.full_name) next = next.split(from.full_name).join(to.full_name)
    if (next !== row.content) await s.from("comments").update({ content: next }).eq("id", row.id)
  }
})

// workspace_members (PK workspace_id,user_id)
await run("workspace_members", () => reassignWithConflict("workspace_members", ["workspace_id"]))

// Personal state deletions
for (const [t, c] of deletions) {
  await run(`delete ${t}.${c}`, async () => {
    const { error } = await s.from(t).delete().eq(c, from.id)
    if (error) throw error
  })
}

console.log("\nReassignment complete.")
