---
description: Deploy the application to Vercel
---

## Context
The app is deployed to Vercel via GitHub. Pushing to `master` triggers automatic deployment.

## Deployment URL
- **Production**: https://bydre.vercel.app
- **DreCrypto**: https://bydre.vercel.app/drecrypto

## Steps

### 1. Check for lint errors locally
// turbo
```bash
npm run lint
```

### 2. Fix any TypeScript errors
// turbo
```bash
npx tsc --noEmit
```

### 3. Test build locally
```bash
npm run build
```

### 4. Stage all changes
// turbo
```bash
git add -A
```

### 5. Commit with descriptive message
```bash
git commit -m "feat: description of changes"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - Styling changes
- `docs:` - Documentation
- `chore:` - Maintenance

### 6. Push to GitHub
```bash
git push origin master
```

### 7. Monitor Vercel build
1. Go to https://vercel.com/dashboard
2. Click on the `bydre` project
3. Watch the deployment logs
4. If build fails, check the error logs

## Common Build Errors

### Unused Variables
```
Error: 'variableName' is assigned a value but never used.
```
**Fix**: Remove the variable or add `// eslint-disable-next-line`

### Missing Dependencies
```
Error: Cannot find module 'package-name'
```
**Fix**: `npm install package-name`

### Type Errors
```
Error: Type 'X' is not assignable to type 'Y'
```
**Fix**: Update types or add proper type assertions

### ESLint Errors
```
Warning: React Hook useEffect has a missing dependency
```
**Fix**: Add dependency to array or disable rule for that line:
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {...}, [])
```

### Image Optimization Warning
```
Warning: Using `<img>` could result in slower LCP
```
**Fix**: Use `next/image` instead of `<img>`:
```tsx
import Image from "next/image"
<Image src="..." alt="..." width={100} height={100} />
```

## Environment Variables
Required env vars in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GENIEMAP_API_TOKEN`

To add/update:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variable for Production/Preview/Development
3. Redeploy for changes to take effect

## Rollback
If deployment has issues:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Related
- `/fix-build-errors` - Detailed error fixing
- `/supabase-migration` - Database changes before deploy
