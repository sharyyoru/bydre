# Contact Enrichment Pipeline

Enrich investor contacts (Name + Phone) with Email, LinkedIn, Job Title, and Company using **multiple sources**:
- **PDL API** - People Data Labs enrichment
- **Google Search** - Find emails and LinkedIn profiles
- **LinkedIn Scraping** - Direct profile data extraction  
- **Company Websites** - Crawl contact pages

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt
playwright install chromium

# 2. Set up API key
cp .env.template .env
# Edit .env and add your PDL API key

# 3. Set up LinkedIn (optional but recommended)
# Export cookies from browser → save as linkedin_cookies.json
python linkedin_session.py instructions

# 4. Run multi-source enrichment
python scrape_all.py --input contacts.csv --output enriched.csv
```

## Multi-Source Scraper (NEW!)

The `scrape_all.py` script uses **all sources in parallel** for maximum coverage:

```bash
# Use all sources
python scrape_all.py -i contacts.csv -o enriched.csv

# Use specific sources only
python scrape_all.py -i contacts.csv --sources pdl,google

# Limit to 50 contacts (for testing)
python scrape_all.py -i contacts.csv --limit 50

# Show browser windows (debugging)
python scrape_all.py -i contacts.csv --no-headless

# Verbose logging
python scrape_all.py -i contacts.csv -v
```

### Source Options

| Source | Flag | Rate Limit | Requirements |
|--------|------|------------|--------------|
| PDL API | `pdl` | 8/sec | PDL_API_KEY in .env |
| Google Search | `google` | 10/min | None (may need CAPTCHA solving) |
| LinkedIn | `linkedin` | 2/min | linkedin_cookies.json |
| Company Websites | `website` | 30/min | Company domain in CSV |

## LinkedIn Setup

The LinkedIn scraper requires your session cookies:

### Option 1: EditThisCookie Extension (Recommended)

1. Install [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie) Chrome extension
2. Go to https://www.linkedin.com and log in
3. Click the extension icon → "Export" (clipboard icon)
4. Create `linkedin_cookies.json` and paste the cookies

### Option 2: Manual Export

1. Go to https://www.linkedin.com and log in
2. Press F12 → Application tab → Cookies → linkedin.com
3. Copy these cookies manually:
   - `li_at` (most important)
   - `JSESSIONID`
   - `lidc`

### Validate Your Session

```bash
python linkedin_session.py validate
```

## Input Format

Your input CSV should have these columns:

| Name | Phone_Number | Company (optional) | Domain (optional) |
|------|--------------|-------------------|-------------------|
| John Smith | +971501234567 | Acme Corp | acme.com |
| Jane Doe | 050 123 4567 | | |

- **Name** and **Phone_Number** are required
- **Company** helps LinkedIn/Google find the right person
- **Domain** enables company website scraping

## Output Format

The enriched CSV includes source tracking:

| Name | Phone | Email | Email_Source | LinkedIn_URL | LinkedIn_Source | Job_Title | Company | Overall_Confidence |
|------|-------|-------|--------------|--------------|-----------------|-----------|---------|-------------------|
| John Smith | +974... | john@acme.com | google | linkedin.com/in/john | linkedin | CEO | Acme Corp | 0.85 |

## PDL-Only Mode (Original)

For simple PDL-only enrichment:

```bash
python enrich.py --input contacts.csv --output enriched.csv
```

## Rate Limits & Daily Limits

| Source | Per Request | Daily Limit |
|--------|-------------|-------------|
| PDL | 8/sec | 10,000 |
| Google | 6 sec delay | 500 |
| LinkedIn | 30 sec delay | 100 |
| Website | 2 sec delay | 1,000 |

**LinkedIn is very strict** - exceeding limits may result in account restrictions.

## Supported Phone Formats

GCC numbers are auto-detected and normalized:

| Input | Output | Country |
|-------|--------|---------|
| 33453304 | +97433453304 | 🇶🇦 Qatar |
| 050 123 4567 | +971501234567 | 🇦🇪 UAE |
| 00966551234567 | +966551234567 | 🇸🇦 Saudi |

## File Structure

```
scripts/enrichment/
├── scrape_all.py         # Multi-source orchestrator (NEW)
├── enrich.py             # PDL-only script (original)
├── phone_sanitizer.py    # Phone normalization
├── pdl_client.py         # PDL API client
├── rate_limiter.py       # Rate limiting (NEW)
├── merger.py             # Result merging (NEW)
├── linkedin_session.py   # LinkedIn session management (NEW)
├── scrapers/
│   ├── google_scraper.py   # Google search scraper (NEW)
│   ├── linkedin_scraper.py # LinkedIn scraper (NEW)
│   └── company_scraper.py  # Company website scraper (NEW)
├── requirements.txt
├── .env.template
├── linkedin_cookies.json   # Your LinkedIn cookies (create this)
└── README.md
```

## Troubleshooting

### "LinkedIn session expired"
Re-export your cookies from the browser and overwrite `linkedin_cookies.json`.

### "Google CAPTCHA detected"
Google may require manual CAPTCHA solving. Run with `--no-headless` to solve it.

### "PDL API key required"
Set your API key in `.env`:
```
PDL_API_KEY=your_key_here
```

### Low match rates
- Add **Company** column to your CSV for better matching
- Try different source combinations with `--sources`
- LinkedIn often has the best GCC coverage

### Script crashed
Just re-run - it will skip already-processed contacts and continue.

## License

Internal use only - DreHomes
