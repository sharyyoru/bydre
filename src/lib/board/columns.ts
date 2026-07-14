export type ColumnType =
  | "status"
  | "priority"
  | "people"
  | "date"
  | "text"
  | "number"
  | "dropdown"
  | "label"
  | "checkbox"
  | "rating"
  | "email"
  | "phone"
  | "url"
  | "formula"
  | "dependency"
  | "progress"
  | "currency"
  | "file"
  | "mirror"

export type ColumnOption = {
  id: string
  name: string
  color: string
}

export type ColumnDefinition = {
  id: string
  board_id: string
  name: string
  type: ColumnType
  position: number
  settings: Record<string, any>
  is_required: boolean
  archived_at: string | null
  created_at: string
}

export type ColumnValue = {
  id: string
  item_id: string
  column_id: string
  value: any
  created_at: string
  updated_at: string
}

export type BoardItem = {
  id: string
  title: string
  description: string | null
  board_id: string
  group_id: string
  type: string
  priority: string
  status_id: string | null
  start_date: string | null
  due_date: string | null
  position: number
  parent_id: string | null
  archived_at: string | null
  created_at: string
  created_by: string
  values: Record<string, any>
  assignees: Assignee[]
  sub_items: BoardItem[]
  comments_count: number
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
}

export type Assignee = {
  user_id: string
  profiles: Profile
}

export type BoardGroup = {
  id: string
  name: string
  color: string
  position: number
  archived_at: string | null
}

export const columnTypeLabels: Record<ColumnType, string> = {
  status: "Status",
  priority: "Priority",
  people: "People",
  date: "Date",
  text: "Text",
  number: "Number",
  dropdown: "Dropdown",
  label: "Label",
  checkbox: "Checkbox",
  rating: "Rating",
  email: "Email",
  phone: "Phone",
  url: "URL",
  formula: "Formula",
  dependency: "Dependency",
  progress: "Progress",
  currency: "Currency",
  file: "File",
  mirror: "Mirror",
}

export function getColumnValue(item: BoardItem, columnId: string): any {
  return item.values?.[columnId]
}

export function getStatusOption(column: ColumnDefinition, value: any): ColumnOption | undefined {
  if (!value) return undefined
  const options = (column.settings?.options || []) as ColumnOption[]
  return options.find((o) => o.id === value)
}

export function getDropdownOption(column: ColumnDefinition, value: any): ColumnOption | undefined {
  if (!value) return undefined
  const options = (column.settings?.options || []) as ColumnOption[]
  return options.find((o) => o.id === value)
}

export function getLabelOptions(column: ColumnDefinition, value: any[]): ColumnOption[] {
  if (!Array.isArray(value)) return []
  const options = (column.settings?.options || []) as ColumnOption[]
  return options.filter((o) => value.includes(o.id))
}

export const priorityOptions = [
  { id: "low", name: "Low", color: "#6B7280" },
  { id: "medium", name: "Medium", color: "#3B82F6" },
  { id: "high", name: "High", color: "#D4AF37" },
  { id: "urgent", name: "Urgent", color: "#EF4444" },
]

export function getPriorityOption(value: string) {
  return priorityOptions.find((p) => p.id === value)
}

export function priorityClass(value: string) {
  switch (value) {
    case "low":
      return "bg-slate-100 text-slate-700"
    case "medium":
      return "bg-blue-100 text-blue-700"
    case "high":
      return "bg-[#D4AF37]/10 text-[#D4AF37]"
    case "urgent":
      return "bg-red-100 text-red-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function formatCurrency(value: number | null, currency = "USD") {
  if (value === null || value === undefined) return ""
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value)
}

export function computeProgress(item: BoardItem, column: ColumnDefinition): number {
  if (!item.sub_items || item.sub_items.length === 0) return 0
  const source = column.settings?.source || "subitems"
  if (source !== "subitems") return 0
  const statusColumnId = column.settings?.status_column_id as string | undefined
  const doneCount = item.sub_items.filter((sub) => {
    if (statusColumnId) {
      const status = sub.values?.[statusColumnId]
      return status === "done" || status === "Done"
    }
    return sub.status_id === "Done"
  }).length
  return Math.round((doneCount / item.sub_items.length) * 100)
}
