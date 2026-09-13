---
description: Add features to the Leads Report AI dashboard
---

## Context
The Leads Report is an AI-powered analytics dashboard for analyzing lead performance data from Excel files. It uses Gemini AI for natural language queries and can generate dynamic charts.

## Features
- **File Upload**: Drag-and-drop Excel files (stored in Supabase)
- **KPI Dashboard**: 8 KPI cards + secondary metrics
- **Funnel Chart**: Lead conversion funnel visualization
- **Agent Leaderboard**: Top performers with conversion rates
- **AI Analyst (Gemini)**: Ask questions in natural language, get charts
- **Data Table**: Sortable, searchable raw data view

## Files Involved
```
src/app/workspace/[id]/leads-report/page.tsx     # Main page
src/app/api/leads-report/
├── route.ts                                      # Read Excel files
├── gemini/route.ts                               # Gemini AI queries
└── upload/route.ts                               # File upload
src/components/leads-report/
├── index.ts                                      # Exports
├── kpi-grid.tsx                                  # KPI cards
├── lead-funnel-chart.tsx                         # Funnel visualization
├── agent-leaderboard.tsx                         # Performance ranking
├── ai-chart-renderer.tsx                         # Dynamic charts from AI
├── ai-chat-panel.tsx                             # Gemini chat interface
└── file-upload-zone.tsx                          # Drag-drop upload
```

## Adding a New KPI Card

Edit `src/components/leads-report/kpi-grid.tsx`:

```tsx
const kpis: KPICard[] = [
  // ... existing KPIs
  {
    label: "New Metric",
    value: calculateNewMetric(),
    icon: <SomeIcon className="h-5 w-5 text-purple-600" />,
    badge: { text: "Label", color: "bg-purple-100 text-purple-800" },
    description: "Optional description"
  }
]
```

## Adding a New Chart Type

Edit `src/components/leads-report/ai-chart-renderer.tsx`:

```tsx
case "newtype":
  return (
    <ResponsiveContainer width="100%" height={300}>
      {/* Your Recharts component */}
    </ResponsiveContainer>
  )
```

## Modifying AI Prompts

Edit `src/app/api/leads-report/gemini/route.ts`:

The `SYSTEM_PROMPT` controls how AI responds. Key sections:
- Analysis instructions
- ChartSpec format (for dynamic charts)
- Lead status terminology

```tsx
const SYSTEM_PROMPT = `You are an expert leads data analyst...

ChartSpec format:
\`\`\`chartSpec
{
  "type": "bar" | "line" | "pie" | "funnel" | "area",
  "title": "Chart Title",
  "data": [{ "name": "Category", "value": 123 }],
  ...
}
\`\`\`
`
```

## Adding Upload File Types

Edit `src/components/leads-report/file-upload-zone.tsx`:

```tsx
const { getRootProps, getInputProps } = useDropzone({
  accept: {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-excel": [".xls"],
    // Add more types:
    "text/csv": [".csv"]
  },
})
```

## Database Schema

```sql
-- supabase/migrations/0044_leads_report_files.sql
CREATE TABLE lead_report_files (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id),
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    sheet_count INTEGER,
    row_count INTEGER,
    metadata JSONB
);
```

## Supabase Storage

Files are stored in the `lead-reports` bucket:
- Path: `{workspace_id}/{timestamp}_{filename}`
- Create bucket in Supabase Dashboard → Storage → New bucket

## Related
- `/supabase-migration` - Database schema changes
- `/api-route` - API endpoint patterns
- `/drecrypto-component` - Component styling patterns
