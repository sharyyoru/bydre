---
description: Add features to the leads/deals pipeline system
---

## Context
The CRM includes lead management and deals pipeline, used by the real estate sales team to track prospects from inquiry to closed deal.

## Lead Lifecycle
```
Lead Created → Qualified → Proposal Sent → Negotiation → Won/Lost
```

## Files Involved
- `src/app/workspace/[id]/leads/` - Leads pages
- `src/app/workspace/[id]/deals/` - Deals pipeline
- `src/components/board/` - Board UI components
- `src/app/api/leads-report/` - Lead analytics API

## Lead Data Structure
```typescript
interface Lead {
  id: string
  created_at: string
  workspace_id: string
  
  // Contact Info
  name: string
  email: string
  phone: string
  
  // Lead Details
  source: string  // website, referral, ad, etc.
  status: string  // new, contacted, qualified, proposal, won, lost
  priority: "low" | "medium" | "high"
  
  // Property Interest
  property_type: string[]
  budget_min: number
  budget_max: number
  location_preference: string[]
  
  // Assignment
  assigned_to: string  // user ID
  
  // Activity
  last_contact: string
  next_followup: string
  notes: string
}
```

## Steps

### 1. Add Lead Status/Stage
Update lead status options:
```typescript
const leadStatuses = [
  { value: "new", label: "New", color: "blue" },
  { value: "contacted", label: "Contacted", color: "yellow" },
  { value: "qualified", label: "Qualified", color: "orange" },
  { value: "proposal", label: "Proposal", color: "purple" },
  { value: "negotiation", label: "Negotiation", color: "pink" },
  { value: "won", label: "Won", color: "green" },
  { value: "lost", label: "Lost", color: "red" },
  // Add new status
  { value: "[new_status]", label: "[Label]", color: "[color]" },
]
```

### 2. Add Lead Source
```typescript
const leadSources = [
  { value: "website", label: "Website Form" },
  { value: "referral", label: "Referral" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "google", label: "Google Ads" },
  { value: "walk_in", label: "Walk-in" },
  // Add new source
  { value: "[source]", label: "[Label]" },
]
```

### 3. Add Lead Scoring
```typescript
interface LeadScore {
  budget_score: number      // 0-25 based on budget
  engagement_score: number  // 0-25 based on interactions
  timeline_score: number    // 0-25 based on urgency
  fit_score: number         // 0-25 based on property match
  total: number             // 0-100
}

function calculateLeadScore(lead: Lead): LeadScore {
  const budget_score = lead.budget_max >= 1000000 ? 25 : lead.budget_max / 40000
  const engagement_score = calculateEngagement(lead.activities)
  const timeline_score = lead.timeline === "immediate" ? 25 : 10
  const fit_score = calculatePropertyFit(lead)
  
  return {
    budget_score,
    engagement_score,
    timeline_score,
    fit_score,
    total: budget_score + engagement_score + timeline_score + fit_score
  }
}
```

### 4. Add Activity Tracking
```typescript
interface LeadActivity {
  id: string
  lead_id: string
  created_at: string
  type: "call" | "email" | "meeting" | "whatsapp" | "note"
  description: string
  created_by: string
  outcome?: string
}

// Add activity
await supabase.from("lead_activities").insert({
  lead_id: leadId,
  type: "call",
  description: "Discussed property requirements",
  outcome: "scheduled_viewing",
  created_by: userId,
})
```

### 5. Create Lead Report
```typescript
// src/app/api/leads-report/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspace_id")
  const dateFrom = searchParams.get("from")
  const dateTo = searchParams.get("to")

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)

  const report = {
    total_leads: leads.length,
    by_status: groupBy(leads, "status"),
    by_source: groupBy(leads, "source"),
    conversion_rate: leads.filter(l => l.status === "won").length / leads.length,
    avg_deal_value: calculateAvgDealValue(leads),
  }

  return NextResponse.json(report)
}
```

## Kanban Pipeline View
```tsx
// Drag and drop lead cards between stages
const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"]

<DragDropContext onDragEnd={handleDragEnd}>
  {stages.map((stage) => (
    <Droppable droppableId={stage} key={stage}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          <h3>{stageLabels[stage]}</h3>
          {leads.filter(l => l.status === stage).map((lead, index) => (
            <Draggable draggableId={lead.id} index={index}>
              <LeadCard lead={lead} />
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  ))}
</DragDropContext>
```

## Related
- `/crm-automation` - Automate lead assignment and follow-ups
- `/crm-owner-sheets` - Link leads to owner sheets
