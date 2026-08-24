"""
Google Search Scraper for finding emails and company information.
Uses Playwright for JavaScript rendering and CAPTCHA handling.
"""

import re
import time
import random
import logging
from dataclasses import dataclass
from typing import Optional, List
from urllib.parse import urlparse, quote_plus

from playwright.sync_api import sync_playwright, Page, Browser

logger = logging.getLogger(__name__)

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# Common email domains to filter out generic emails
GENERIC_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'icloud.com', 'me.com', 'aol.com',
    'mail.com', 'protonmail.com', 'zoho.com'
}


@dataclass
class GoogleResult:
    """Result from Google search scraping."""
    email: Optional[str] = None
    company_domain: Optional[str] = None
    linkedin_url: Optional[str] = None
    source_url: Optional[str] = None
    confidence: float = 0.0
    error: Optional[str] = None


class GoogleScraper:
    """
    Scrapes Google search results to find emails and company information.
    
    Usage:
        scraper = GoogleScraper()
        result = scraper.search("John Smith", "Acme Corp")
        print(result.email, result.company_domain)
        scraper.close()
    """
    
    def __init__(self, headless: bool = True):
        """
        Initialize the Google scraper.
        
        Args:
            headless: Run browser in headless mode (default True)
        """
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self._initialized = False
    
    def _init_browser(self):
        """Initialize Playwright browser if not already done."""
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
        
        # Create context with realistic settings
        context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
        )
        
        self.page = context.new_page()
        self._initialized = True
        logger.info("Google scraper browser initialized")
    
    def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        self._initialized = False
        logger.info("Google scraper closed")
    
    def __enter__(self):
        self._init_browser()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def _random_delay(self, min_sec: float = 1.0, max_sec: float = 3.0):
        """Add a random delay to appear more human-like."""
        time.sleep(random.uniform(min_sec, max_sec))
    
    def _extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text."""
        emails = EMAIL_PATTERN.findall(text)
        # Filter out generic emails
        return [
            email for email in emails
            if email.split('@')[1].lower() not in GENERIC_EMAIL_DOMAINS
        ]
    
    def _extract_linkedin_url(self, text: str) -> Optional[str]:
        """Extract LinkedIn profile URL from text."""
        linkedin_pattern = re.compile(
            r'https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?'
        )
        match = linkedin_pattern.search(text)
        return match.group(0) if match else None
    
    def _extract_company_domain(self, urls: List[str], company_name: str) -> Optional[str]:
        """Extract likely company domain from search result URLs."""
        company_words = set(company_name.lower().split())
        
        for url in urls:
            try:
                parsed = urlparse(url)
                domain = parsed.netloc.lower()
                
                # Skip common sites
                if any(site in domain for site in [
                    'google', 'linkedin', 'facebook', 'twitter',
                    'youtube', 'wikipedia', 'instagram'
                ]):
                    continue
                
                # Check if company name appears in domain
                domain_clean = domain.replace('www.', '').split('.')[0]
                if any(word in domain_clean for word in company_words if len(word) > 3):
                    return domain.replace('www.', '')
            except Exception:
                continue
        
        return None
    
    def search(
        self,
        name: str,
        company: Optional[str] = None,
        timeout: int = 30
    ) -> GoogleResult:
        """
        Search Google for contact information.
        
        Args:
            name: Person's name to search for
            company: Optional company name for more accurate results
            timeout: Request timeout in seconds
        
        Returns:
            GoogleResult with found information
        """
        try:
            self._init_browser()
            
            # Build search query
            if company:
                query = f'"{name}" "{company}" email contact'
            else:
                query = f'"{name}" email contact'
            
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            logger.debug(f"Searching Google: {query}")
            
            # Navigate to Google
            self.page.goto(search_url, timeout=timeout * 1000)
            self._random_delay(1, 2)
            
            # Check for CAPTCHA
            if "captcha" in self.page.url.lower() or self.page.locator("text=unusual traffic").count() > 0:
                logger.warning("Google CAPTCHA detected - manual intervention needed")
                return GoogleResult(error="CAPTCHA detected - please solve manually")
            
            # Accept cookies if prompted
            try:
                accept_btn = self.page.locator("button:has-text('Accept all')")
                if accept_btn.count() > 0:
                    accept_btn.click()
                    self._random_delay(0.5, 1)
            except Exception:
                pass
            
            # Get page content
            content = self.page.content()
            
            # Extract emails
            emails = self._extract_emails(content)
            best_email = emails[0] if emails else None
            
            # Extract LinkedIn URL
            linkedin_url = self._extract_linkedin_url(content)
            
            # Extract company domain from result URLs
            result_links = self.page.locator("a[href]").all()
            urls = [link.get_attribute("href") for link in result_links[:20] if link.get_attribute("href")]
            company_domain = self._extract_company_domain(urls, company) if company else None
            
            # Calculate confidence
            confidence = 0.0
            if best_email:
                confidence += 0.5
                # Higher confidence if email domain matches company
                if company_domain and company_domain in best_email:
                    confidence += 0.3
            if linkedin_url:
                confidence += 0.2
            
            return GoogleResult(
                email=best_email,
                company_domain=company_domain,
                linkedin_url=linkedin_url,
                source_url=search_url,
                confidence=min(confidence, 1.0),
            )
            
        except Exception as e:
            logger.error(f"Google search error: {e}")
            return GoogleResult(error=str(e))
    
    def search_for_linkedin(self, name: str, company: Optional[str] = None) -> Optional[str]:
        """
        Search specifically for LinkedIn profile URL.
        
        Args:
            name: Person's name
            company: Optional company name
        
        Returns:
            LinkedIn profile URL or None
        """
        try:
            self._init_browser()
            
            if company:
                query = f'site:linkedin.com/in "{name}" "{company}"'
            else:
                query = f'site:linkedin.com/in "{name}"'
            
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            self.page.goto(search_url, timeout=30000)
            self._random_delay(1, 2)
            
            # Look for LinkedIn links in results
            content = self.page.content()
            return self._extract_linkedin_url(content)
            
        except Exception as e:
            logger.error(f"LinkedIn search error: {e}")
            return None


if __name__ == "__main__":
    # Test the scraper
    logging.basicConfig(level=logging.DEBUG)
    
    with GoogleScraper(headless=False) as scraper:
        result = scraper.search("John Smith", "Google")
        print(f"Email: {result.email}")
        print(f"LinkedIn: {result.linkedin_url}")
        print(f"Company Domain: {result.company_domain}")
        print(f"Confidence: {result.confidence}")
