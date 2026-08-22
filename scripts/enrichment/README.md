# Contact Enrichment Pipeline

Enrich investor contacts (Name + Phone) with Email, LinkedIn, Job Title, and Company using the People Data Labs API.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up API key
cp .env.template .env
# Edit .env and add your PDL API key

# 3. Prepare your input CSV
# Must have columns: Name, Phone_Number

# 4. Run enrichment
python enrich.py --input raw_contacts.csv --output enriched_investors.csv
```

## Input Format

Your input CSV must have these columns:

| Name | Phone_Number |
|------|--------------|
| John Smith | +971501234567 |
| Jane Doe | 050 123 4567 |
| Ahmed Al Maktoum | 00971521234567 |

The script auto-detects and normalizes UAE/GCC phone numbers.

## Output Format

The enriched CSV will contain:

| Name | Phone_Number | Email | LinkedIn_URL | Job_Title | Company | Confidence | Error |
|------|--------------|-------|--------------|-----------|---------|------------|-------|
| John Smith | +971501234567 | john@company.com | linkedin.com/in/johnsmith | CEO | Company Inc | 0.85 | |

## Usage Options

```bash
# Basic usage
python enrich.py -i contacts.csv -o enriched.csv

# Dry run (test phone sanitization without API calls)
python enrich.py -i contacts.csv --dry-run

# Process only first 10 contacts (for testing)
python enrich.py -i contacts.csv --limit 10

# Verbose logging
python enrich.py -i contacts.csv -v
```

## Features

- **Phone Sanitization**: Automatically normalizes UAE/GCC numbers to E.164 format
- **Rate Limiting**: Respects PDL API limits (8 req/sec with buffer)
- **Retry Logic**: Auto-retries on rate limits or server errors
- **Resume Capability**: Skips already-processed contacts if script crashes
- **Progress Saving**: Saves results every 10 records
- **Real-time Logging**: See which rows succeed/fail as they process

## Supported Phone Formats

All these formats are auto-converted to `+971501234567`:

- `050 123 4567`
- `+971 50 123 4567`
- `00971501234567`
- `971501234567`
- `0501234567`
- `(050) 123-4567`

## API Pricing

| Plan | Cost | Best For |
|------|------|----------|
| Free Sandbox | $0 (1,000 calls/month) | Testing |
| Starter | $99/month + $0.08/record | 1K-5K contacts |
| Growth | Custom pricing | 5K+ contacts |

Sign up: https://www.peopledatalabs.com/signup

## Troubleshooting

### "PDL API key required"
Set your API key in `.env` file:
```
PDL_API_KEY=your_key_here
```

### "Rate limit exceeded"
The script auto-retries with exponential backoff. If it persists, you may have hit your monthly limit.

### "No match found"
PDL couldn't find data for this contact. This is normal for some records.

### Script crashed mid-way
Just re-run the same command. It will skip already-processed contacts and continue where it left off.

## File Structure

```
scripts/enrichment/
├── enrich.py           # Main script
├── phone_sanitizer.py  # Phone normalization
├── pdl_client.py       # PDL API client
├── requirements.txt    # Python dependencies
├── .env.template       # API key template
└── README.md           # This file
```

## License

Internal use only - DreHomes
