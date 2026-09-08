---
description: Systematic debugging workflow for any issue
---

## Context
Use this workflow when encountering bugs or unexpected behavior in the application.

## Steps

### 1. Reproduce the issue
- Note exact steps to reproduce
- Identify: Browser? Device? User role?
- Is it consistent or intermittent?

### 2. Check browser console
Open DevTools (F12) → Console tab
Look for:
- Red error messages
- Network failures (also check Network tab)
- React errors/warnings

### 3. Check server logs
For API issues, check Vercel logs:
1. Vercel Dashboard → Project → Logs
2. Filter by "Runtime Logs"
3. Look for errors around the time of issue

### 4. Add debugging output

#### Frontend (React components)
```tsx
console.log("[ComponentName] State:", { state, props })
console.log("[ComponentName] API Response:", data)
console.error("[ComponentName] Error:", error)
```

#### API Routes
```typescript
console.log("[API /endpoint] Request:", {
  method: req.method,
  params: searchParams.toString(),
  body: await req.clone().json(),
})

console.log("[API /endpoint] Response:", {
  status: 200,
  data: result,
})

console.error("[API /endpoint] Error:", {
  error: error.message,
  stack: error.stack,
})
```

### 5. Isolate the problem

#### Is it frontend or backend?
```tsx
// Test with hardcoded data
const [data] = useState([{ id: 1, name: "Test" }])  // Remove API call
```

#### Is it a specific record?
```typescript
// Log the problematic record
const problem = items.find(i => i.id === "known-id")
console.log("Problem item:", problem)
```

#### Is it a timing issue?
```tsx
// Add delays to reveal race conditions
await new Promise(r => setTimeout(r, 1000))
```

### 6. Common issues and fixes

#### "Cannot read property 'x' of undefined"
```tsx
// Problem
return item.property.nested

// Fix: Optional chaining
return item?.property?.nested

// Fix: Default value
return item?.property?.nested ?? "default"
```

#### "Objects are not valid as a React child"
```tsx
// Problem: Rendering object directly
return <div>{data}</div>

// Fix: Stringify or access property
return <div>{JSON.stringify(data)}</div>
return <div>{data.name}</div>
```

#### "Too many re-renders"
```tsx
// Problem: State update in render
const [count, setCount] = useState(0)
setCount(count + 1)  // ❌ Causes infinite loop

// Fix: Use effect or event handler
useEffect(() => {
  setCount(count + 1)
}, [dependency])  // ✅ Only runs when dependency changes
```

#### "Hydration mismatch"
```tsx
// Problem: Server/client render different content
return <div>{typeof window !== 'undefined' ? 'client' : 'server'}</div>

// Fix: Use client component or useEffect
"use client"
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

#### API returns empty data
```typescript
// Check Supabase query
const { data, error } = await supabase.from("table").select("*")
console.log("Query result:", { data, error })

// Common issues:
// - RLS policy blocking access
// - Wrong table name
// - Filter too restrictive
```

### 7. Fix and verify

1. Make the fix
2. Test locally: `npm run dev`
3. Test the exact reproduction steps
4. Check for regressions (did fix break something else?)
5. Remove debug logging before commit

### 8. Commit the fix
```bash
git add -A
git commit -m "fix: [description of what was fixed]"
git push
```

## Debugging Tools

### React DevTools
- Install browser extension
- Inspect component state and props
- Profile re-renders

### Network Tab
- Check request/response payloads
- Verify status codes
- Check timing

### Supabase Dashboard
- SQL Editor: Run queries directly
- Logs: Check database errors
- Auth: Verify user sessions

## Related
- `/fix-build-errors` - For build-time errors
- `/deploy-vercel` - After fixing, deploy
