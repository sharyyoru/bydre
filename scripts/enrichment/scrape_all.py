#!/usr/bin/env python3
"""
Contact Enrichment Pipeline - Multi-Source Scraper
Orchestrates PDL API, Google, LinkedIn, and company website scraping.

Usage:
    python scrape_all.py --input contacts.csv --output enriched.csv
    python scrape_all.py --input contacts.csv --sources pdl,google,linkedin
"""

import argparse
import csv
import json
import logging
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None

from phone_sanitizer import normalize_to_e164
from pdl_client import PDLClient
from rate_limiter import RateLimiter, DailyLimiter
from merger import ResultMerger, SourceResult, MergedResult, create_source_result
from scrapers.google_scraper import GoogleScraper
from scrapers.linkedin_scraper import LinkedInScraper
from scrapers.company_scraper import CompanyScraper

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Daily limits per source
DAILY_LIMITS = {
    'linkedin': 100,  # Conservative to avoid bans
    'google': 500,
    'website': 1000,
    'pdl': 10000,
}


class EnrichmentPipeline:
    """
    Multi-source contact enrichment pipeline.
    
    Orchestrates:
    - PDL API enrichment
    - Google search scraping
    - LinkedIn profile scraping
    - Company website scraping
    """
    
    def __init__(
        self,
        sources: List[str] = None,
        linkedin_cookies: str = "linkedin_cookies.json",
        headless: bool = True,
    ):
        """
        Initialize the enrichment pipeline.
        
        Args:
            sources: List of sources to use ['pdl', 'google', 'linkedin', 'website']
            linkedin_cookies: Path to LinkedIn cookies JSON
            headless: Run browsers in headless mode
        """
        self.sources = sources or ['pdl', 'google', 'linkedin', 'website']
        self.linkedin_cookies = linkedin_cookies
        self.headless = headless
        
        self.rate_limiter = RateLimiter()
        self.daily_limiter = DailyLimiter(DAILY_LIMITS)
        self.merger = ResultMerger()
        
        # Initialize scrapers lazily
        self._pdl_client: Optional[PDLClient] = None
        self._google_scraper: Optional[GoogleScraper] = None
        self._linkedin_scraper: Optional[LinkedInScraper] = None
        self._company_scraper: Optional[CompanyScraper] = None
        
        # Stats
        self.stats = {
            'total': 0,
            'enriched': 0,
            'no_match': 0,
            'failed': 0,
            'by_source': {src: {'success': 0, 'failed': 0} for src in self.sources}
        }
    
    @property
    def pdl_client(self) -> Optional[PDLClient]:
        """Lazy-load PDL client."""
        if self._pdl_client is None and 'pdl' in self.sources:
            try:
                self._pdl_client = PDLClient()
                logger.info("PDL client initialized")
            except ValueError as e:
                logger.warning(f"PDL client not available: {e}")
        return self._pdl_client
    
    @property
    def google_scraper(self) -> Optional[GoogleScraper]:
        """Lazy-load Google scraper."""
        if self._google_scraper is None and 'google' in self.sources:
            self._google_scraper = GoogleScraper(headless=self.headless)
            logger.info("Google scraper initialized")
        return self._google_scraper
    
    @property
    def linkedin_scraper(self) -> Optional[LinkedInScraper]:
        """Lazy-load LinkedIn scraper."""
        if self._linkedin_scraper is None and 'linkedin' in self.sources:
            if Path(self.linkedin_cookies).exists():
                self._linkedin_scraper = LinkedInScraper(
                    self.linkedin_cookies,
                    headless=self.headless
                )
                logger.info("LinkedIn scraper initialized")
            else:
                logger.warning(f"LinkedIn cookies not found: {self.linkedin_cookies}")
        return self._linkedin_scraper
    
    @property
    def company_scraper(self) -> Optional[CompanyScraper]:
        """Lazy-load company scraper."""
        if self._company_scraper is None and 'website' in self.sources:
            self._company_scraper = CompanyScraper(headless=self.headless)
            logger.info("Company website scraper initialized")
        return self._company_scraper
    
    def close(self):
        """Close all scrapers and cleanup resources."""
        if self._google_scraper:
            self._google_scraper.close()
        if self._linkedin_scraper:
            self._linkedin_scraper.close()
        if self._company_scraper:
            self._company_scraper.close()
        logger.info("All scrapers closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def _enrich_pdl(self, name: str, phone: str, company: Optional[str] = None) -> SourceResult:
        """Enrich via PDL API."""
        if not self.pdl_client:
            return SourceResult(source='pdl', error='PDL client not available')
        
        if not self.daily_limiter.can_request('pdl'):
            return SourceResult(source='pdl', error='Daily limit reached')
        
        try:
            self.rate_limiter.wait('pdl')
            self.daily_limiter.record_request('pdl')
            
            result = self.pdl_client.identify_person(name=name, phone=phone)
            
            if result.is_enriched:
                self.stats['by_source']['pdl']['success'] += 1
                return SourceResult(
                    source='pdl',
                    email=result.email,
                    linkedin_url=result.linkedin_url,
                    job_title=result.job_title,
                    company=result.company,
                    confidence=result.confidence or 0.8,
                )
            else:
                self.stats['by_source']['pdl']['failed'] += 1
                return SourceResult(source='pdl', error=result.error or 'No match')
                
        except Exception as e:
            self.stats['by_source']['pdl']['failed'] += 1
            return SourceResult(source='pdl', error=str(e))
    
    def _enrich_google(self, name: str, company: Optional[str] = None) -> SourceResult:
        """Enrich via Google search."""
        if not self.google_scraper:
            return SourceResult(source='google', error='Google scraper not available')
        
        if not self.daily_limiter.can_request('google'):
            return SourceResult(source='google', error='Daily limit reached')
        
        try:
            self.rate_limiter.wait('google')
            self.daily_limiter.record_request('google')
            
            result = self.google_scraper.search(name, company)
            
            if result.error:
                self.stats['by_source']['google']['failed'] += 1
                return SourceResult(source='google', error=result.error)
            
            if result.email or result.linkedin_url:
                self.stats['by_source']['google']['success'] += 1
                return SourceResult(
                    source='google',
                    email=result.email,
                    linkedin_url=result.linkedin_url,
                    confidence=result.confidence,
                )
            else:
                self.stats['by_source']['google']['failed'] += 1
                return SourceResult(source='google', error='No results found')
                
        except Exception as e:
            self.stats['by_source']['google']['failed'] += 1
            return SourceResult(source='google', error=str(e))
    
    def _enrich_linkedin(self, name: str, company: Optional[str] = None) -> SourceResult:
        """Enrich via LinkedIn scraping."""
        if not self.linkedin_scraper:
            return SourceResult(source='linkedin', error='LinkedIn scraper not available')
        
        if not self.daily_limiter.can_request('linkedin'):
            return SourceResult(source='linkedin', error='Daily limit reached')
        
        try:
            self.rate_limiter.wait('linkedin')
            self.daily_limiter.record_request('linkedin')
            
            result = self.linkedin_scraper.enrich_contact(name, company)
            
            if result.error:
                self.stats['by_source']['linkedin']['failed'] += 1
                return SourceResult(source='linkedin', error=result.error)
            
            if result.linkedin_url or result.email:
                self.stats['by_source']['linkedin']['success'] += 1
                return SourceResult(
                    source='linkedin',
                    email=result.email,
                    linkedin_url=result.linkedin_url,
                    job_title=result.job_title,
                    company=result.company,
                    location=result.location,
                    confidence=result.confidence,
                )
            else:
                self.stats['by_source']['linkedin']['failed'] += 1
                return SourceResult(source='linkedin', error='Profile not found')
                
        except Exception as e:
            self.stats['by_source']['linkedin']['failed'] += 1
            return SourceResult(source='linkedin', error=str(e))
    
    def _enrich_website(self, name: str, domain: Optional[str] = None) -> SourceResult:
        """Enrich via company website scraping."""
        if not self.company_scraper or not domain:
            return SourceResult(source='website', error='Company domain required')
        
        if not self.daily_limiter.can_request('website'):
            return SourceResult(source='website', error='Daily limit reached')
        
        try:
            self.rate_limiter.wait('website')
            self.daily_limiter.record_request('website')
            
            result = self.company_scraper.find_email(domain, name)
            
            if result.error:
                self.stats['by_source']['website']['failed'] += 1
                return SourceResult(source='website', error=result.error)
            
            if result.email:
                self.stats['by_source']['website']['success'] += 1
                return SourceResult(
                    source='website',
                    email=result.email,
                    confidence=result.confidence,
                )
            else:
                self.stats['by_source']['website']['failed'] += 1
                return SourceResult(source='website', error='No email found')
                
        except Exception as e:
            self.stats['by_source']['website']['failed'] += 1
            return SourceResult(source='website', error=str(e))
    
    def enrich_contact(
        self,
        name: str,
        phone: str,
        original_phone: str,
        company: Optional[str] = None,
        domain: Optional[str] = None,
    ) -> MergedResult:
        """
        Enrich a single contact using all enabled sources.
        
        Args:
            name: Contact name
            phone: Normalized phone number
            original_phone: Original phone from CSV
            company: Optional company name
            domain: Optional company domain for website scraping
        
        Returns:
            MergedResult with data from all sources
        """
        results: List[SourceResult] = []
        
        # Run each source
        if 'pdl' in self.sources:
            results.append(self._enrich_pdl(name, phone, company))
        
        if 'google' in self.sources:
            results.append(self._enrich_google(name, company))
        
        if 'linkedin' in self.sources:
            results.append(self._enrich_linkedin(name, company))
        
        if 'website' in self.sources and domain:
            results.append(self._enrich_website(name, domain))
        
        # Merge results
        merged = self.merger.merge(name, phone, original_phone, results)
        
        # Update stats
        self.stats['total'] += 1
        if merged.status == 'enriched':
            self.stats['enriched'] += 1
        elif merged.status == 'no_match':
            self.stats['no_match'] += 1
        else:
            self.stats['failed'] += 1
        
        return merged
    
    def process_csv(
        self,
        input_file: str,
        output_file: str,
        limit: Optional[int] = None,
        resume: bool = True,
    ) -> List[MergedResult]:
        """
        Process a CSV file of contacts.
        
        Args:
            input_file: Path to input CSV
            output_file: Path to output CSV
            limit: Max contacts to process
            resume: Skip already-processed contacts
        
        Returns:
            List of MergedResult
        """
        # Load input CSV
        contacts = self._load_csv(input_file)
        
        if limit:
            contacts = contacts[:limit]
        
        # Load already-processed phones for resume
        processed_phones = set()
        if resume and Path(output_file).exists():
            processed_phones = self._load_processed_phones(output_file)
            logger.info(f"Resuming: {len(processed_phones)} already processed")
        
        # Filter out processed contacts
        remaining = [c for c in contacts if c['phone'] not in processed_phones]
        
        logger.info(f"Processing {len(remaining)} contacts (of {len(contacts)} total)")
        logger.info(f"Sources: {', '.join(self.sources)}")
        logger.info(f"Output: {output_file}")
        
        results: List[MergedResult] = []
        
        # Process contacts with progress bar
        iterator = remaining
        if tqdm:
            iterator = tqdm(remaining, desc="Enriching", unit="contact")
        
        for contact in iterator:
            try:
                result = self.enrich_contact(
                    name=contact['name'],
                    phone=contact['phone'],
                    original_phone=contact['original_phone'],
                    company=contact.get('company'),
                    domain=contact.get('domain'),
                )
                results.append(result)
                
                # Log result
                status_icon = "✓" if result.status == 'enriched' else "✗"
                logger.debug(
                    f"{status_icon} {contact['name']}: "
                    f"{result.email or 'no email'} | "
                    f"{result.linkedin_url or 'no LinkedIn'}"
                )
                
                # Save incrementally
                self._append_to_csv(output_file, result)
                
            except KeyboardInterrupt:
                logger.warning("Interrupted by user")
                break
            except Exception as e:
                logger.error(f"Error processing {contact['name']}: {e}")
                continue
        
        # Print summary
        self._print_summary()
        
        return results
    
    def _load_csv(self, filepath: str) -> List[Dict[str, Any]]:
        """Load contacts from CSV."""
        contacts = []
        
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Find name column
                name = (
                    row.get('Name') or 
                    row.get('name') or 
                    row.get('Full_Name') or 
                    row.get('full_name') or 
                    ''
                ).strip()
                
                # Find phone column
                raw_phone = (
                    row.get('Phone_Number') or 
                    row.get('phone_number') or 
                    row.get('Phone') or 
                    row.get('phone') or 
                    row.get('Mobile') or 
                    ''
                ).strip()
                
                # Find optional columns
                company = (
                    row.get('Company') or 
                    row.get('company') or 
                    row.get('Organization') or 
                    ''
                ).strip() or None
                
                domain = (
                    row.get('Domain') or 
                    row.get('domain') or 
                    row.get('Website') or 
                    ''
                ).strip() or None
                
                if name and raw_phone:
                    phone = normalize_to_e164(raw_phone)
                    contacts.append({
                        'name': name,
                        'phone': phone or raw_phone,
                        'original_phone': raw_phone,
                        'company': company,
                        'domain': domain,
                    })
        
        return contacts
    
    def _load_processed_phones(self, filepath: str) -> set:
        """Load already-processed phone numbers from output CSV."""
        phones = set()
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    phone = row.get('Phone', '')
                    if phone:
                        phones.add(phone)
        except Exception:
            pass
        return phones
    
    def _append_to_csv(self, filepath: str, result: MergedResult):
        """Append a result to the output CSV."""
        data = result.to_dict()
        
        file_exists = Path(filepath).exists()
        
        with open(filepath, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=data.keys())
            
            if not file_exists:
                writer.writeheader()
            
            writer.writerow(data)
    
    def _print_summary(self):
        """Print enrichment summary."""
        print("\n" + "="*60)
        print("ENRICHMENT SUMMARY")
        print("="*60)
        print(f"Total processed:    {self.stats['total']}")
        print(f"Enriched:           {self.stats['enriched']}")
        print(f"No match:           {self.stats['no_match']}")
        print(f"Failed:             {self.stats['failed']}")
        
        if self.stats['total'] > 0:
            rate = (self.stats['enriched'] / self.stats['total']) * 100
            print(f"Success rate:       {rate:.1f}%")
        
        print("\nBy Source:")
        for source, data in self.stats['by_source'].items():
            if source in self.sources:
                print(f"  {source}: {data['success']} success, {data['failed']} failed")
        
        print("\nDaily limits remaining:")
        daily_stats = self.daily_limiter.get_stats()
        for source, data in daily_stats.items():
            if source in self.sources:
                print(f"  {source}: {data['remaining']} / {data['limit']}")
        
        print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description="Enrich contacts using multiple sources (PDL, Google, LinkedIn, Company websites)"
    )
    
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to input CSV file (must have Name and Phone_Number columns)",
    )
    
    parser.add_argument(
        "--output", "-o",
        default="enriched_contacts.csv",
        help="Path to output CSV file (default: enriched_contacts.csv)",
    )
    
    parser.add_argument(
        "--sources", "-s",
        default="pdl,google,linkedin,website",
        help="Comma-separated list of sources to use (default: pdl,google,linkedin,website)",
    )
    
    parser.add_argument(
        "--linkedin-cookies",
        default="linkedin_cookies.json",
        help="Path to LinkedIn cookies JSON file",
    )
    
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=None,
        help="Limit number of contacts to process",
    )
    
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="Don't skip already-processed contacts",
    )
    
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Show browser windows (useful for debugging)",
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    sources = [s.strip() for s in args.sources.split(',')]
    
    try:
        with EnrichmentPipeline(
            sources=sources,
            linkedin_cookies=args.linkedin_cookies,
            headless=not args.no_headless,
        ) as pipeline:
            pipeline.process_csv(
                input_file=args.input,
                output_file=args.output,
                limit=args.limit,
                resume=not args.no_resume,
            )
    except KeyboardInterrupt:
        print("\n\nInterrupted. Progress has been saved.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
