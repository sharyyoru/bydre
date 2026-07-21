import { createClient } from "@supabase/supabase-js"

/**
 * Seeds the "Strategy" group on the Content Calendar board with property-focused
 * social deliverables (Reels, YouTube Shorts, Story sets), assigned to Wilson,
 * status "To Do", with deadlines spread across weekdays over the next ~4 weeks.
 *
 * Usage:
 *   node scripts/seed-strategy-content.mjs --workspace=<slug|id> [--wilson=<email|name>] [--commit]
 *
 * Dry-run by default. Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const SEED_MARKER = "strategy-ad-v1"

const commit = process.argv.includes("--commit")
const workspaceArg = process.argv.find((a) => a.startsWith("--workspace="))?.split("=")[1]
const wilsonArg = process.argv.find((a) => a.startsWith("--wilson="))?.split("=")[1]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || !workspaceArg) {
  console.error(
    "Usage: node scripts/seed-strategy-content.mjs --workspace=<slug|id> [--wilson=<email|name>] [--commit]\n" +
      "Requires env NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const LANGUAGES = "Arabic, Russian, Turkish, German, Spanish, French & Italian (English base)"
const LOCALIZATION =
  "Localization: produce one master cut, then localize with burned-in subtitles + native caption/hashtags. Priority languages every week: Arabic + Russian."
const DISTRIBUTION =
  "Distribution: share with the Sales Team and post on DRE social. Primary page: @drehomes.global."

// --- Property research (baked into descriptions; Wilson refines via Post Idea link) ---
const PROPERTIES = [
  {
    key: "abu-dhabi-investment",
    name: "Generic Abu Dhabi Investment",
    url: "https://www.investabudhabi.gov.ae", // confirm
    crossMain: true,
    angle:
      "Top-of-funnel investor education: why Abu Dhabi now — Golden Visa, 0% property tax, freehold zones, and rental yields vs Dubai.",
    points: [
      "Golden Visa pathways for property investors",
      "Freehold ownership zones for all nationalities",
      "Stable, government-backed growth story",
    ],
  },
  {
    key: "aldar",
    name: "Aldar Projects",
    url: "https://www.aldar.com",
    crossMain: false,
    angle:
      "Abu Dhabi's largest developer — flagship communities across Yas & Saadiyat with strong secondary-market liquidity.",
    points: ["Blue-chip developer track record", "Yas / Saadiyat lifestyle communities", "Liquid resale market"],
  },
  {
    key: "hudayriyat-modon",
    name: "Hudayriyat by Modon",
    url: "https://www.modon.com/real-estate",
    crossMain: true,
    angle:
      "51M m² active-lifestyle island — Surf Abu Dhabi, Velodrome, UFC arena; Bashayer sold out in a single day.",
    points: ["Government-backed masterplan", "Sports & wellness destination", "Scarcity-driven island demand"],
  },
  {
    key: "al-reem-modon",
    name: "Al Reem Island by Modon",
    url: "https://www.modon.com/real-estate",
    crossMain: false,
    angle:
      "Mature freehold zone (Reem Hills, Maysan, Mayar, Thoraya, Muheira) with strong rental demand and ADGM proximity.",
    points: ["Established rental market", "Freehold apartments & townhouses", "Next to Al Maryah financial district"],
  },
  {
    key: "jubail-island",
    name: "Jubail Island",
    url: "https://www.jubailisland.ae",
    crossMain: false,
    angle: "Low-density mangrove living — nature-first villas and wellness positioning minutes from the city.",
    points: ["Mangrove & nature reserve setting", "Low-density luxury villas", "Wellness-led lifestyle"],
  },
  {
    key: "manchester-city-ohana",
    name: "Manchester City by Ohana",
    url: "https://www.ohana.ae/projects/manchester-city-yas-residences-by-ohana/",
    crossMain: true,
    angle:
      "World's first Manchester City-branded residences on Yas Canal — ~AED 15B, integrated MC Academy, completion 2029.",
    points: ["Globally unique sports-branded residence", "Yas Canal waterfront", "Record 72h sales momentum"],
  },
  {
    key: "sobha-abu-dhabi",
    name: "Sobha Abu Dhabi City",
    url: "https://www.sobharealty.com",
    crossMain: false,
    angle: "Sobha Realty's Abu Dhabi expansion — backward-integrated build quality as the core investor story.",
    points: ["In-house build quality control", "Premium finishing standards", "New-to-market AD launch"],
  },
  {
    key: "emirates-development",
    name: "Emirates Development",
    url: "https://www.aldar.com", // confirm exact developer/project URL
    crossMain: false,
    angle: "Emerging Abu Dhabi development opportunity — confirm exact developer/project and refine the angle.",
    points: ["Emerging AD opportunity", "Confirm developer details", "Investor-focused framing"],
  },
  {
    key: "taraf",
    name: "Taraf",
    url: "https://www.tarafholding.com",
    crossMain: false,
    angle:
      "Yas Holding's luxury arm — W Residences Al Maryah Island (first W in AD) and Fay Hills at Masdar City.",
    points: ["Branded luxury residences (W Hotels)", "Al Maryah Island financial district", "Sustainability at Fay Hills"],
  },
]

function buildDescription(prop, format) {
  const formatLine =
    format === "reel"
      ? "Format: Instagram Reel (hook-led, 15-45s, cinematic vertical)."
      : format === "short"
      ? "Format: YouTube Short — repurposed from the Reel master."
      : "Format: Instagram Story set (3-5 frames: highlight, key stat, CTA sticker)."
  return [
    `${prop.name} — ${prop.angle}`,
    "",
    formatLine,
    `Key points: ${prop.points.join("; ")}.`,
    `Languages: ${LANGUAGES}.`,
    LOCALIZATION,
    DISTRIBUTION,
    prop.crossMain ? "Cross-post: also feature on @drehomes_realestate (brand)." : "",
    "CTA: drive investor DMs / lead capture.",
  ]
    .filter(Boolean)
    .join("\n")
}

// --- Build 24-item dataset: 9 Reels + 9 Shorts + 6 Story sets ---
const STORY_KEYS = new Set([
  "abu-dhabi-investment",
  "aldar",
  "hudayriyat-modon",
  "manchester-city-ohana",
  "sobha-abu-dhabi",
  "taraf",
])

const dataset = []
for (const prop of PROPERTIES) {
  dataset.push({ prop, format: "reel", platform: "instagram", title: `${prop.name} — Hero Reel` })
}
for (const prop of PROPERTIES) {
  dataset.push({ prop, format: "short", platform: "youtube", title: `${prop.name} — YouTube Short` })
}
for (const prop of PROPERTIES) {
  if (STORY_KEYS.has(prop.key)) {
    dataset.push({ prop, format: "story", platform: "instagram", title: `${prop.name} — Story Set` })
  }
}

// --- Deadline distribution: weekdays only, ~6/week, starting next Monday ---
function nextMonday(from = new Date()) {
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const add = day === 0 ? 1 : day === 6 ? 2 : 8 - day // jump to the upcoming Monday
  d.setDate(d.getDate() + add)
  return d
}

function addWeekdays(start, n) {
  const d = new Date(start)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

function iso(d) {
  return d.toISOString().slice(0, 10)
}

const anchor = nextMonday()
const PER_WEEK = 6
// index -> weekday offset: ~6 items across 5 weekdays/week, then next week
function dueDateForIndex(i) {
  const week = Math.floor(i / PER_WEEK)
  const within = i % PER_WEEK // 0..5
  const weekdayOffset = week * 5 + Math.min(within, 4) // Mon..Fri, 6th item shares Fri
  return iso(addWeekdays(anchor, weekdayOffset))
}

const items = dataset.map((entry, i) => ({
  ...entry,
  referenceUrl: entry.prop.url,
  dueDate: dueDateForIndex(i),
  description: buildDescription(entry.prop, entry.format),
}))

// ---------------------------------------------------------------------------

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceArg)
const wsQuery = supabase.from("workspaces").select("id,name,slug")
const { data: workspace, error: wsError } = isUuid
  ? await wsQuery.eq("id", workspaceArg).maybeSingle()
  : await wsQuery.eq("slug", workspaceArg).maybeSingle()
if (wsError || !workspace) throw new Error(`Workspace not found: ${workspaceArg}`)

const { data: board, error: boardError } = await supabase
  .from("boards")
  .select("id,name,type")
  .eq("workspace_id", workspace.id)
  .eq("name", "Content Calendar")
  .is("archived_at", null)
  .maybeSingle()
if (boardError || !board) throw new Error("Content Calendar board not found in this workspace")

// Columns
const { data: columns, error: colError } = await supabase
  .from("columns")
  .select("id,name,type,position,settings")
  .eq("board_id", board.id)
  .is("archived_at", null)
if (colError) throw colError

const colByName = new Map((columns || []).map((c) => [c.name, c]))

// Ensure "Post Idea" url column
let postIdeaCol = colByName.get("Post Idea")
if (!postIdeaCol) {
  const maxPos = (columns || []).reduce((m, c) => Math.max(m, c.position ?? 0), 0)
  if (commit) {
    const { data: created, error: createErr } = await supabase
      .from("columns")
      .insert({ board_id: board.id, name: "Post Idea", type: "url", position: maxPos + 1, settings: {} })
      .select("id,name,type,position,settings")
      .single()
    if (createErr) throw createErr
    postIdeaCol = created
  } else {
    postIdeaCol = { id: "(to-be-created)", name: "Post Idea", type: "url" }
  }
}

const statusCol = colByName.get("Status")
const todoStatusId = statusCol?.settings?.options?.[0]?.id || null
const platformCol = colByName.get("Platform")
const platformOptions = platformCol?.settings?.options || []
const platformIdByKey = {
  instagram: platformOptions.find((o) => /instagram/i.test(o.name))?.id || "platform-instagram",
  youtube: platformOptions.find((o) => /youtube/i.test(o.name))?.id || "platform-youtube",
}
const publishDateCol = colByName.get("Publish Date")

// Strategy group
let { data: group } = await supabase
  .from("groups")
  .select("id,name")
  .eq("board_id", board.id)
  .eq("name", "Strategy")
  .is("archived_at", null)
  .maybeSingle()
if (!group) {
  if (commit) {
    const { data: created, error } = await supabase
      .from("groups")
      .insert({ board_id: board.id, name: "Strategy", color: "#D4AF37", position: 999 })
      .select("id,name")
      .single()
    if (error) throw error
    group = created
    console.warn('Note: "Strategy" group was not found and has been created.')
  } else {
    group = { id: "(to-be-created)", name: "Strategy" }
  }
}

// Resolve Wilson
const { data: members, error: memErr } = await supabase
  .from("workspace_members")
  .select("user_id, role, profiles(id,email,full_name)")
  .eq("workspace_id", workspace.id)
if (memErr) throw memErr
const needle = (wilsonArg || "wilson").toLowerCase()
const wilsonMatches = (members || []).filter((m) => {
  const p = m.profiles
  if (!p) return false
  return (p.full_name || "").toLowerCase().includes(needle) || (p.email || "").toLowerCase().includes(needle)
})
if (wilsonMatches.length === 0) throw new Error(`No workspace member matched "${needle}" (use --wilson=<email>)`)
if (wilsonMatches.length > 1)
  throw new Error(
    `Ambiguous Wilson match (${wilsonMatches.length}): ${wilsonMatches
      .map((m) => m.profiles.email)
      .join(", ")}. Use --wilson=<email>`
  )
const wilson = wilsonMatches[0].profiles

// created_by = an admin
const admin = (members || []).find((m) => m.role === "admin")
if (!admin) throw new Error("No admin found to attribute created_by")

// Existing seeded items (idempotency)
const { data: existing } = await supabase
  .from("items")
  .select("id,title,metadata")
  .eq("board_id", board.id)
  .eq("group_id", group.id)
  .is("archived_at", null)
const existingTitles = new Set(
  (existing || [])
    .filter((it) => it?.metadata?.seed === SEED_MARKER)
    .map((it) => it.title)
)

const toInsert = items.filter((it) => !existingTitles.has(it.title))

const summary = {
  dryRun: !commit,
  workspace: workspace.name,
  board: board.name,
  group: group.name,
  wilson: { name: wilson.full_name, email: wilson.email },
  columns: {
    postIdea: postIdeaCol?.id,
    status: statusCol?.id || null,
    todoStatusId,
    platform: platformCol?.id || null,
    publishDate: publishDateCol?.id || null,
  },
  totalPlanned: items.length,
  alreadySeeded: existingTitles.size,
  willInsert: toInsert.length,
  deadlineRange: items.length ? { first: items[0].dueDate, last: items[items.length - 1].dueDate } : null,
  sample: toInsert.slice(0, 5).map((it) => ({ title: it.title, platform: it.platform, due: it.dueDate })),
}
console.log(JSON.stringify(summary, null, 2))

if (!commit) {
  console.log("\nDry run only. Re-run with --commit to write.")
  process.exit(0)
}

if (!todoStatusId) console.warn('Warning: no "To Do" status option resolved; Status will be left unset.')

let inserted = 0
for (const [position, it] of toInsert.entries()) {
  const { data: item, error } = await supabase
    .from("items")
    .insert({
      board_id: board.id,
      group_id: group.id,
      title: it.title,
      description: it.description,
      type: "content",
      priority: "medium",
      due_date: it.dueDate,
      created_by: admin.user_id,
      position,
      metadata: { seed: SEED_MARKER, property: it.prop.key, format: it.format },
    })
    .select("id")
    .single()
  if (error) throw error

  const values = []
  if (statusCol && todoStatusId) values.push({ item_id: item.id, column_id: statusCol.id, value: todoStatusId })
  if (platformCol) values.push({ item_id: item.id, column_id: platformCol.id, value: platformIdByKey[it.platform] })
  if (publishDateCol) values.push({ item_id: item.id, column_id: publishDateCol.id, value: it.dueDate })
  if (postIdeaCol?.id) values.push({ item_id: item.id, column_id: postIdeaCol.id, value: it.referenceUrl })
  if (values.length) {
    const { error: vErr } = await supabase.from("item_values").insert(values)
    if (vErr) throw vErr
  }

  const { error: aErr } = await supabase
    .from("item_assignees")
    .insert({ item_id: item.id, user_id: wilson.id })
  if (aErr) throw aErr

  inserted++
}

console.log(`\nInserted ${inserted} Strategy items, assigned to ${wilson.full_name || wilson.email}.`)
