---
description: Add a shadcn/ui component to the project
---

## Context
This project uses shadcn/ui for base components. Components are added via CLI and customized in `src/components/ui/`.

## Available Components
Most common components already installed:
- `button`, `badge`, `card`
- `input`, `textarea`, `select`
- `dialog`, `sheet`, `popover`
- `tabs`, `accordion`
- `table`, `data-table`
- `dropdown-menu`, `context-menu`
- `toast`, `sonner`

## Steps

### 1. Check if component exists
// turbo
```bash
ls src/components/ui/
```

### 2. Add component via CLI
```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add calendar
npx shadcn@latest add slider
npx shadcn@latest add switch
npx shadcn@latest add avatar
npx shadcn@latest add progress
```

### 3. Use the component
```tsx
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

export function MyComponent() {
  const [date, setDate] = useState<Date>()
  const [value, setValue] = useState(50)
  const [enabled, setEnabled] = useState(false)

  return (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
      />
      
      <Slider
        value={[value]}
        onValueChange={([v]) => setValue(v)}
        max={100}
        step={1}
      />
      
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </>
  )
}
```

## Component Customization

### Styling with className
```tsx
<Button className="bg-[#C9A962] hover:bg-[#b8994d] text-black">
  Custom Styled
</Button>
```

### Creating Variants
```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        // Add custom variant
        gold: "bg-[#C9A962] text-black hover:bg-[#b8994d]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        // Add custom size
        xl: "h-14 rounded-lg px-10 text-lg",
      },
    },
  }
)
```

### Composing Components
```tsx
// Create a custom component using primitives
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function StatCard({ title, value, trend }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Badge variant={trend > 0 ? "default" : "destructive"}>
          {trend > 0 ? "+" : ""}{trend}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
```

## Common Components Reference

### Button
```tsx
<Button variant="default">Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Option 1</SelectItem>
    <SelectItem value="opt2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Toast (Sonner)
```tsx
import { toast } from "sonner"

toast.success("Success message")
toast.error("Error message")
toast.loading("Loading...")
toast.promise(asyncFn, {
  loading: "Loading...",
  success: "Done!",
  error: "Failed",
})
```

## Related
- `/drecrypto-component` - Create DreCrypto-styled component
- `/crm-board-column` - Use UI components in board
