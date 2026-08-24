# Email Enrichment Strategy for GCC Contacts

## The Problem

You have **Name + Phone** (Qatar numbers) but need **Email**.

Current APIs (PDL, Apollo, Hunter) fail because:
- They need **Company/Domain** to find emails, not phone numbers
- GCC phone coverage is poor in US-centric databases

**Result: 0% hit rate with phone-only lookups**

---

## The Solution: 3-Stage Waterfall Enrichment

### Expected Results
| Approach | Hit Rate | Cost |
|----------|----------|------|
| Single provider (PDL only) | 40-60% | Low |
| **Waterfall (3+ providers)** | **80-95%** | Medium |
| Enterprise (ZoomInfo) | 85%+ | $15K+/year |

---

## Stage 1: Phone → Company/Social (CallerKit)

**CallerKit** specializes in Middle East / GCC data.

```
Input:  +974 33 453 304 (Qatar phone)
Output: {
  "name": "Captain Antonio Rama Toscano",
  "company": "Qatar Airways",
  "email": "a.toscano@qatarairways.com",  // if available
  "social": { "linkedin": "linkedin.com/in/..." }
}
```

**Coverage:** Qatar, UAE, Saudi, Bahrain, Kuwait, Oman, Egypt, Jordan
**Pricing:** $99/month for 20,000 lookups
**Sign up:** https://caller-kit.com/

---

## Stage 2: Name + Company → Email (Waterfall)

Once we have Company/Domain from Stage 1, we waterfall through email finders:

```
Apollo (try first - best coverage)
   ↓ if no result
Hunter (good for verified emails)
   ↓ if no result  
Snov.io (LinkedIn enrichment)
   ↓ if no result
Findymail (last resort, highest accuracy)
```

### Provider Comparison

| Provider | Coverage | Cost/Email | Best For |
|----------|----------|------------|----------|
| Apollo | ~65% | $0.02-0.05 | US/EU tech companies |
| Hunter | ~50% | $0.02-0.03 | Domain-based search |
| Snov.io | ~55% | $0.03-0.04 | LinkedIn profiles |
| Findymail | ~70% | $0.05 | Hard-to-find contacts |
| FullEnrich | ~80% | $0.25-0.50 | 20+ providers combined |

---

## Stage 3: Email Verification

**Every email must be verified before use.**

```
Input:  a.toscano@qatarairways.com
Output: {
  "status": "valid",
  "deliverable": true,
  "catch_all": false
}
```

**Tools:**
- Hunter (included with finder)
- ZeroBounce ($0.008/email)
- BounceBan

---

## Implementation Files

```
scripts/enrichment/
├── callerkit_client.py    # Stage 1: GCC phone lookup
├── apollo_client.py       # Stage 2: Email finder
├── hunter_client.py       # Stage 2+3: Email finder + verify
├── waterfall_enricher.py  # Orchestrates all stages
├── multi_provider.py      # Legacy orchestrator
└── .env.template          # API keys config
```

---

## Quick Start

### 1. Get API Keys

| Service | Sign Up | Free Tier |
|---------|---------|-----------|
| CallerKit | https://caller-kit.com/ | 10 lookups |
| Apollo | https://apollo.io/sign-up | 50/month |
| Hunter | https://hunter.io/users/sign_up | 25 searches + 50 verifies |

### 2. Configure `.env`

```bash
cd scripts/enrichment
cp .env.template .env
# Edit .env with your API keys
```

### 3. Run Enrichment

```bash
# Test single contact
python waterfall_enricher.py

# Or use the web UI at /workspace/{id}/enrichment
```

---

## CSV Format for Best Results

**Minimum (current):**
```csv
Name, Phone_Number
Captain Antonio Rama Toscano, +97433453304
```

**Better (if you have company info):**
```csv
Name, Phone_Number, Company, Domain
Captain Antonio Rama Toscano, +97433453304, Qatar Airways, qatarairways.com
```

---

## Competitor Tools (For Reference)

### All-in-One Platforms
- **Clay** ($149/mo) - 75+ providers, workflow builder
- **FullEnrich** (pay-per-result) - 20+ providers, managed waterfall
- **BetterContact** - 98% hit rate, 4-layer verification

### Enterprise
- **ZoomInfo** ($15K+/year) - 87% accuracy, intent data
- **Clearbit** ($99+/mo) - Real-time enrichment API

### Budget Options
- **Snov.io** ($39/mo) - Email finder + drip campaigns
- **Lusha** ($29/user/mo) - LinkedIn extension

---

## Roadmap

- [x] Apollo.io integration
- [x] Hunter.io integration  
- [x] Multi-provider fallback
- [ ] CallerKit integration (GCC phones)
- [ ] Snov.io integration (LinkedIn)
- [ ] FullEnrich API (managed waterfall)
- [ ] LinkedIn Sales Navigator scraping
- [ ] Web UI provider selection
- [ ] Bulk enrichment progress tracking

---

## Cost Optimization Tips

1. **Use free tiers first** - Apollo (50), Hunter (25), Snov.io (50)
2. **CallerKit for GCC** - $99/mo gets 20K lookups (great ROI for Qatar data)
3. **Verify before sending** - Bounces hurt deliverability
4. **Cache results** - Don't re-enrich known contacts
5. **Waterfall order matters** - Put cheapest/highest-coverage first
