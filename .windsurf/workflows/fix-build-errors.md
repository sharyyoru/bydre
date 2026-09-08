---
description: Diagnose and fix Vercel build failures
---

## Context
When Vercel build fails, this workflow helps identify and fix common issues.

## Steps

### 1. Get the error from Vercel logs
Copy the exact error message from the build output.

### 2. Identify error type

#### TypeScript Errors
```
Type 'X' is not assignable to type 'Y'
Property 'x' does not exist on type 'Y'
Cannot find name 'X'
```
**Common fixes:**
- Add proper type annotations
- Import missing types
- Add optional chaining (`?.`)
- Add type assertions (`as Type`)

#### ESLint Errors (treated as errors in build)
```
'variable' is assigned a value but never used
'Component' is defined but never used
```
**Fixes:**
1. Remove unused code
2. Or add disable comment:
```tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unusedVar = "needed for something"
```

#### ESLint Warnings (usually don't fail build)
```
React Hook useEffect has a missing dependency
```
**Fixes:**
1. Add missing dependency:
```tsx
useEffect(() => {
  fetchData()
}, [fetchData])  // Add missing dep
```
2. Or wrap function in useCallback:
```tsx
const fetchData = useCallback(async () => {
  // ...
}, [dependency])
```
3. Or disable rule for line:
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { fetchData() }, [])
```

#### Image Warnings
```
Using `<img>` could result in slower LCP
```
**Fix:** Use next/image:
```tsx
import Image from "next/image"
<Image src="..." alt="..." width={100} height={100} />
```

#### Module Not Found
```
Cannot find module 'package-name'
Module not found: Can't resolve './component'
```
**Fixes:**
1. Install missing package: `npm install package-name`
2. Check import path spelling
3. Check file exists at path
4. Check tsconfig.json paths

### 3. Fix the error locally

// turbo
```bash
npm run lint
```

// turbo
```bash
npx tsc --noEmit
```

### 4. Test build locally
```bash
npm run build
```

### 5. Commit and push fix
```bash
git add -A
git commit -m "fix: [description of fix]"
git push
```

## Quick Reference

### Silence Specific ESLint Rule (file)
```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Silence Next Line
```tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

### Fix Missing 'use client'
If using hooks in component:
```tsx
"use client"  // Add at top of file

import { useState } from "react"
```

### Fix Missing Import
```tsx
// Error: Cannot find name 'NextRequest'
import { NextRequest, NextResponse } from "next/server"
```

### Fix Async Params (Next.js 15+)
```tsx
// Old (causes error)
export default function Page({ params }: { params: { id: string } })

// New (correct)
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
}
```

### Fix 'any' Type Errors
```tsx
// Error: Unexpected any
function handle(data: any)  // ❌

// Fix options:
function handle(data: unknown)  // ✅ Use unknown
function handle(data: Record<string, unknown>)  // ✅ For objects
function handle(data: SpecificType)  // ✅ Best: use proper type
```

## Common Files with Issues

| File Pattern | Typical Issue |
|--------------|---------------|
| `page.tsx` | Missing 'use client', async params |
| `route.ts` | Error type assertions, missing imports |
| `component.tsx` | Unused props, missing deps in hooks |
| `*.test.ts` | Missing test utils |

## Related
- `/deploy-vercel` - Deploy after fixing
- `/debug-issue` - General debugging
