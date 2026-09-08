---
description: Create workflow automations for the CRM system
---

## Context
Automations trigger actions based on events (e.g., "When status changes to Done, notify owner"). Built with triggers, conditions, and actions.

## Files Involved
- `src/components/automations/automation-builder.tsx` - UI for building automations
- `src/app/api/automations/` - API routes
- `supabase/migrations/0003_automations.sql` - Database schema

## Automation Structure
```typescript
interface Automation {
  id: string
  workspace_id: string
  board_id: string
  name: string
  enabled: boolean
  trigger: Trigger
  conditions: Condition[]
  actions: Action[]
}

interface Trigger {
  type: "status_change" | "date_arrives" | "item_created" | "column_change"
  config: Record<string, any>
}

interface Condition {
  field: string
  operator: "equals" | "contains" | "greater_than" | "is_empty"
  value: any
}

interface Action {
  type: "notify" | "update_column" | "create_item" | "send_email" | "webhook"
  config: Record<string, any>
}
```

## Steps

### 1. Add New Trigger Type
In automation-builder.tsx:
```tsx
const triggerTypes = [
  { value: "status_change", label: "When status changes" },
  { value: "date_arrives", label: "When date arrives" },
  { value: "item_created", label: "When item is created" },
  { value: "[new_trigger]", label: "When [description]" },  // Add new
]

// Add trigger config UI
{trigger.type === "[new_trigger]" && (
  <TriggerNewConfig
    config={trigger.config}
    onChange={(config) => setTrigger({ ...trigger, config })}
  />
)}
```

### 2. Add New Action Type
```tsx
const actionTypes = [
  { value: "notify", label: "Send notification" },
  { value: "update_column", label: "Update column value" },
  { value: "create_item", label: "Create new item" },
  { value: "send_email", label: "Send email" },
  { value: "[new_action]", label: "[New action]" },  // Add new
]

// Add action config UI
{action.type === "[new_action]" && (
  <ActionNewConfig
    config={action.config}
    onChange={(config) => setAction({ ...action, config })}
  />
)}
```

### 3. Handle Trigger in Backend
```typescript
// src/app/api/automations/execute/route.ts
async function executeTrigger(trigger: Trigger, event: Event) {
  switch (trigger.type) {
    case "status_change":
      return event.column_id === trigger.config.column_id &&
             event.new_value === trigger.config.status
    
    case "[new_trigger]":
      // Implement trigger logic
      return checkNewTrigger(trigger.config, event)
    
    default:
      return false
  }
}
```

### 4. Execute Action
```typescript
async function executeAction(action: Action, context: ExecutionContext) {
  switch (action.type) {
    case "notify":
      await createNotification({
        user_id: action.config.user_id,
        message: interpolate(action.config.message, context),
        link: `/board/${context.board_id}/item/${context.item_id}`,
      })
      break

    case "update_column":
      await updateItemColumn(
        context.item_id,
        action.config.column_id,
        action.config.value
      )
      break

    case "[new_action]":
      // Implement new action
      await executeNewAction(action.config, context)
      break
  }
}
```

## Common Automation Patterns

### Status Change Notification
```json
{
  "trigger": {
    "type": "status_change",
    "config": { "column_id": "status", "to_status": "Done" }
  },
  "actions": [{
    "type": "notify",
    "config": {
      "user_id": "{item.owner_id}",
      "message": "Task '{item.name}' has been completed!"
    }
  }]
}
```

### Due Date Reminder
```json
{
  "trigger": {
    "type": "date_arrives",
    "config": { "column_id": "due_date", "offset_days": -1 }
  },
  "actions": [{
    "type": "notify",
    "config": {
      "user_id": "{item.owner_id}",
      "message": "'{item.name}' is due tomorrow!"
    }
  }]
}
```

### Auto-assign on Create
```json
{
  "trigger": {
    "type": "item_created",
    "config": { "group_id": "group-123" }
  },
  "actions": [{
    "type": "update_column",
    "config": {
      "column_id": "owner",
      "value": ["user-456"]
    }
  }]
}
```

## Template Variables
Available in action configs:
- `{item.id}` - Item ID
- `{item.name}` - Item name
- `{item.owner_id}` - Owner user ID
- `{item.columns.column_id}` - Column value
- `{board.id}` - Board ID
- `{board.name}` - Board name
- `{user.name}` - Triggering user name
- `{now}` - Current timestamp

## Related
- `/crm-board-column` - Add columns for automation triggers
- `/supabase-migration` - Store automation data
