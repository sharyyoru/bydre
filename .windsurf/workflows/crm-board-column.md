---
description: Add a new column type to the CRM board system
---

## Context
The board system (similar to Monday.com) displays items in rows with configurable columns. Column types include: status, owner, date, text, number, dropdown, etc.

## Board Structure
- **Boards** contain **Groups**
- **Groups** contain **Items**
- **Items** have **Columns** with values
- Column definitions stored in board metadata

## Files Involved
- `src/components/board/board-view.tsx` - Main board component
- `src/components/board/column-*.tsx` - Individual column components
- `src/app/workspace/[id]/board/[boardId]/page.tsx` - Board page

## Steps

### 1. Create Column Component
```tsx
// src/components/board/column-[type].tsx
"use client"

import { useState } from "react"

interface ColumnTypeProps {
  value: any
  itemId: string
  columnId: string
  onUpdate: (value: any) => void
  editable?: boolean
}

export function ColumnType({ value, itemId, columnId, onUpdate, editable = true }: ColumnTypeProps) {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  const handleSave = async () => {
    await onUpdate(localValue)
    setEditing(false)
  }

  if (editing && editable) {
    return (
      <div className="flex items-center gap-2">
        {/* Edit UI */}
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full px-2 py-1 bg-background border rounded"
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => editable && setEditing(true)}
      className="px-2 py-1 cursor-pointer hover:bg-muted/50 rounded"
    >
      {value || <span className="text-muted-foreground">-</span>}
    </div>
  )
}
```

### 2. Register Column Type
In `board-view.tsx`, add to column renderer:
```tsx
const renderColumn = (column: Column, item: Item) => {
  switch (column.type) {
    case "status":
      return <ColumnStatus {...props} />
    case "owner":
      return <ColumnOwner {...props} />
    // Add new type
    case "[type]":
      return <ColumnType {...props} />
    default:
      return <ColumnText {...props} />
  }
}
```

### 3. Add Column to Board Settings
Allow users to add this column type:
```tsx
const columnTypes = [
  { value: "text", label: "Text" },
  { value: "status", label: "Status" },
  { value: "owner", label: "Owner" },
  { value: "date", label: "Date" },
  { value: "[type]", label: "New Type" }, // Add here
]
```

### 4. Handle Database Storage
Column values are stored as JSONB. Define the schema:
```typescript
interface ColumnValue {
  column_id: string
  value: any  // Type-specific value structure
}

// For complex types, define structure:
interface DateColumnValue {
  date: string  // ISO date
  includeTime?: boolean
  reminder?: string
}
```

## Existing Column Types

| Type | Component | Value Structure |
|------|-----------|-----------------|
| `text` | `column-text.tsx` | `string` |
| `status` | `column-status.tsx` | `{ label, color }` |
| `owner` | `column-owner.tsx` | `string[]` (user IDs) |
| `date` | `column-date.tsx` | `string` (ISO date) |
| `number` | `column-number.tsx` | `number` |
| `dropdown` | `column-dropdown.tsx` | `string` |
| `checkbox` | `column-checkbox.tsx` | `boolean` |
| `link` | `column-link.tsx` | `{ url, text }` |
| `file` | `column-file.tsx` | `{ url, name }[]` |
| `tags` | `column-tags.tsx` | `string[]` |

## Common Patterns

### Inline Editing
```tsx
const [editing, setEditing] = useState(false)

return editing ? (
  <EditableInput onSave={handleSave} onCancel={() => setEditing(false)} />
) : (
  <DisplayValue onClick={() => setEditing(true)} />
)
```

### Optimistic Updates
```tsx
const handleUpdate = async (newValue: any) => {
  const previousValue = value
  // Update UI immediately
  onUpdate(newValue)
  
  try {
    await saveToDatabase(newValue)
  } catch (error) {
    // Revert on failure
    onUpdate(previousValue)
    toast.error("Failed to update")
  }
}
```

### Color Picker (for status)
```tsx
const colors = [
  { value: "green", label: "Done", bg: "bg-green-500" },
  { value: "yellow", label: "In Progress", bg: "bg-yellow-500" },
  { value: "red", label: "Stuck", bg: "bg-red-500" },
  { value: "gray", label: "Not Started", bg: "bg-gray-500" },
]
```

## Related
- `/crm-automation` - Trigger automation on column change
- `/supabase-migration` - Update board schema if needed
