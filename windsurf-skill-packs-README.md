# DreHomes Windsurf Skill Packs

Workflow files for the DreHomes real estate megaplan. Import these into Windsurf to get full project context and executable commands.

## What's Included

### DreCrypto Platform (5 workflows)
| Workflow | Command | Purpose |
|----------|---------|---------|
| `drecrypto-add-page.md` | `/drecrypto-add-page` | Add new page to DreCrypto |
| `drecrypto-property-feature.md` | `/drecrypto-property-feature` | Add feature to property detail |
| `drecrypto-api-endpoint.md` | `/drecrypto-api-endpoint` | Create DreCrypto API route |
| `drecrypto-component.md` | `/drecrypto-component` | Create DreCrypto component |
| `drecrypto-crypto-integration.md` | `/drecrypto-crypto-integration` | Add crypto features |

### CRM & Board System (4 workflows)
| Workflow | Command | Purpose |
|----------|---------|---------|
| `crm-board-column.md` | `/crm-board-column` | Add board column type |
| `crm-automation.md` | `/crm-automation` | Create workflow automation |
| `crm-lead-feature.md` | `/crm-lead-feature` | Add lead/deals feature |
| `crm-owner-sheets.md` | `/crm-owner-sheets` | Work with owner sheets |

### Infrastructure (4 workflows)
| Workflow | Command | Purpose |
|----------|---------|---------|
| `supabase-migration.md` | `/supabase-migration` | Create database migration |
| `deploy-vercel.md` | `/deploy-vercel` | Deploy to Vercel |
| `api-route.md` | `/api-route` | Create API route |
| `fix-build-errors.md` | `/fix-build-errors` | Fix build failures |

### Common Patterns (3 workflows)
| Workflow | Command | Purpose |
|----------|---------|---------|
| `add-ui-component.md` | `/add-ui-component` | Add shadcn/ui component |
| `debug-issue.md` | `/debug-issue` | Systematic debugging |
| `project-overview.md` | `/project-overview` | Full project context |

## Installation

### Option 1: Copy folder
1. Extract `windsurf-skill-packs.zip`
2. Copy the `.windsurf` folder to your project root
3. Restart Windsurf/Cascade

### Option 2: Merge with existing
If you already have `.windsurf/workflows/`:
1. Extract the zip
2. Copy individual `.md` files from `.windsurf/workflows/` to your existing folder

## Usage

In Windsurf chat, type `/` to see available workflows:
```
/project-overview
/drecrypto-add-page
/deploy-vercel
```

Or just describe what you want to do - Cascade will suggest relevant workflows.

## Requirements
- Windsurf IDE
- Node.js 18+
- Access to bydre repository

## Support
Contact the DreHomes dev team for questions.
