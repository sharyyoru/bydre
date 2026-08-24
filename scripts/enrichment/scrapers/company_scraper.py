"""
Company Website Scraper for finding contact emails.
Crawls common contact pages and extracts emails matching contact names.
"""

import re
import time
import random
import logging
from dataclasses import dataclass
from typing import Optional, List, Set
from urllib.parse import urlparse, urljoin

from playwright.sync_api import sync_playwright, Page, Browser
from bs4 import BeautifulSoup

try:
    from fuzzywuzzy import fuzz
except ImportError:
    fuzz = None

logger = logging.getLogger(__name__)

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# Common contact page paths to check
CONTACT_PATHS = [
    '/contact',
    '/contact-us',
    '/contact.html',
    '/about',
    '/about-us',
    '/team',
    '/our-team',
    '/leadership',
    '/management',
    '/people',
    '/staff',
    '/directory',
]


@dataclass
class CompanyResult:
    """Result from company website scraping."""
    email: Optional[str] = None
    source_url: Optional[str] = None
    all_emails: List[str] = None
    confidence: float = 0.0
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.all_emails is None:
            self.all_emails = []


class CompanyScraper:
    """
    Scrapes company websites for contact email addresses.
    
    Usage:
        scraper = CompanyScraper()
        result = scraper.find_email("example.com", "John Smith")
        print(result.email)
        scraper.close()
    """
    
    def __init__(self, headless: bool = True):
        """
        Initialize the company website scraper.
        
        Args:
            headless: Run browser in headless mode (default True)
        """
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self._initialized = False
    
    def _init_browser(self):
        """Initialize Playwright browser."""
        if self._initialized:
            return
        
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        
        context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        )
        
        self.page = context.new_page()
        self._initialized = True
        logger.info("Company scraper browser initialized")
    
    def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        self._initialized = False
    
    def __enter__(self):
        self._init_browser()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def _random_delay(self, min_sec: float = 0.5, max_sec: float = 1.5):
        """Add a random delay."""
        time.sleep(random.uniform(min_sec, max_sec))
    
    def _extract_emails(self, html: str) -> List[str]:
        """Extract all email addresses from HTML content."""
        emails = EMAIL_PATTERN.findall(html)
        # Remove duplicates while preserving order
        seen = set()
        unique_emails = []
        for email in emails:
            email_lower = email.lower()
            if email_lower not in seen:
                seen.add(email_lower)
                unique_emails.append(email)
        return unique_emails
    
    def _match_name_to_email(
        self,
        emails: List[str],
        name: str
    ) -> Optional[tuple[str, float]]:
        """
        Find the email that best matches the given name.
        
        Args:
            emails: List of email addresses
            name: Person's name to match
        
        Returns:
            Tuple of (best_email, confidence) or None
        """
        if not emails or not name:
            return None
        
        name_parts = name.lower().split()
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        
        best_match = None
        best_score = 0
        
        for email in emails:
            local_part = email.split('@')[0].lower()
            score = 0
            
            # Check for exact name matches
            if first_name and first_name in local_part:
                score += 40
            if last_name and last_name in local_part:
                score += 40
            
            # Check for common email patterns
            # firstname.lastname@
            if f"{first_name}.{last_name}" in local_part:
                score += 20
            # firstnamelastname@
            elif f"{first_name}{last_name}" in local_part:
                score += 15
            # f.lastname@
            elif first_name and f"{first_name[0]}.{last_name}" in local_part:
                score += 15
            # first initial + lastname
            elif first_name and f"{first_name[0]}{last_name}" in local_part:
                score += 10
            
            # Use fuzzy matching if available
            if fuzz and score < 50:
                fuzzy_score = fuzz.partial_ratio(
                    f"{first_name}{last_name}",
                    local_part.replace('.', '').replace('_', '')
                )
                score = max(score, fuzzy_score * 0.8)
            
            if score > best_score:
                best_score = score
                best_match = email
        
        if best_match and best_score >= 30:
            return (best_match, best_score / 100)
        
        return None
    
    def _normalize_domain(self, domain: str) -> str:
        """Normalize domain to base URL."""
        domain = domain.strip().lower()
        
        # Remove protocol if present
        if '://' in domain:
            domain = domain.split('://')[1]
        
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        
        # Remove trailing slash and path
        domain = domain.split('/')[0]
        
        return domain
    
    def find_email(
        self,
        domain: str,
        name: str,
        timeout: int = 15
    ) -> CompanyResult:
        """
        Search company website for an email matching the given name.
        
        Args:
            domain: Company domain (e.g., "example.com")
            name: Person's name to find email for
            timeout: Page load timeout in seconds
        
        Returns:
            CompanyResult with found email and metadata
        """
        try:
            self._init_browser()
            
            domain = self._normalize_domain(domain)
            base_url = f"https://{domain}"
            
            all_emails: Set[str] = set()
            pages_checked = []
            
            # First, try the homepage
            try:
                logger.debug(f"Checking homepage: {base_url}")
                self.page.goto(base_url, timeout=timeout * 1000)
                self._random_delay()
                
                content = self.page.content()
                homepage_emails = self._extract_emails(content)
                all_emails.update(homepage_emails)
                pages_checked.append(base_url)
                
            except Exception as e:
                logger.debug(f"Homepage failed: {e}")
            
            # Try common contact pages
            for path in CONTACT_PATHS:
                if len(all_emails) >= 20:  # Enough emails collected
                    break
                
                try:
                    url = urljoin(base_url, path)
                    logger.debug(f"Checking: {url}")
                    
                    self.page.goto(url, timeout=timeout * 1000)
                    self._random_delay(0.5, 1)
                    
                    # Check if we got a 404 or redirect to homepage
                    if self.page.url.rstrip('/') == base_url.rstrip('/'):
                        continue
                    
                    content = self.page.content()
                    page_emails = self._extract_emails(content)
                    all_emails.update(page_emails)
                    pages_checked.append(url)
                    
                except Exception as e:
                    logger.debug(f"Page {path} failed: {e}")
                    continue
            
            all_emails_list = list(all_emails)
            
            if not all_emails_list:
                return CompanyResult(
                    all_emails=[],
                    error="No emails found on website"
                )
            
            # Try to match name to email
            match_result = self._match_name_to_email(all_emails_list, name)
            
            if match_result:
                matched_email, confidence = match_result
                return CompanyResult(
                    email=matched_email,
                    source_url=pages_checked[-1] if pages_checked else base_url,
                    all_emails=all_emails_list,
                    confidence=confidence,
                )
            else:
                # Return first email as fallback with low confidence
                return CompanyResult(
                    email=all_emails_list[0] if all_emails_list else None,
                    source_url=pages_checked[-1] if pages_checked else base_url,
                    all_emails=all_emails_list,
                    confidence=0.2,  # Low confidence - no name match
                )
            
        except Exception as e:
            logger.error(f"Company scrape error: {e}")
            return CompanyResult(error=str(e))
    
    def scrape_domain(self, domain: str, timeout: int = 15) -> List[str]:
        """
        Extract all emails from a company website.
        
        Args:
            domain: Company domain
            timeout: Page load timeout
        
        Returns:
            List of found email addresses
        """
        result = self.find_email(domain, "", timeout)
        return result.all_emails


if __name__ == "__main__":
    # Test the scraper
    logging.basicConfig(level=logging.DEBUG)
    
    with CompanyScraper(headless=False) as scraper:
        # Test finding email for a person
        result = scraper.find_email("microsoft.com", "Satya Nadella")
        print(f"Best match: {result.email}")
        print(f"Confidence: {result.confidence}")
        print(f"All emails found: {len(result.all_emails)}")
        for email in result.all_emails[:5]:
            print(f"  - {email}")
