"""
LinkedIn Profile Scraper using Playwright with session cookies.
Implements human-like behavior to avoid detection.
"""

import json
import re
import time
import random
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Dict, Any

from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext

logger = logging.getLogger(__name__)


@dataclass
class LinkedInResult:
    """Result from LinkedIn profile scraping."""
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    connections: Optional[int] = None
    confidence: float = 0.0
    error: Optional[str] = None


class LinkedInScraper:
    """
    Scrapes LinkedIn profiles using saved session cookies.
    
    Requires:
        - LinkedIn session cookies exported from browser
        - Human-like delays to avoid detection
    
    Usage:
        scraper = LinkedInScraper("linkedin_cookies.json")
        result = scraper.scrape_profile("https://linkedin.com/in/john-smith")
        print(result.job_title, result.company)
        scraper.close()
    """
    
    # Rate limiting: max 2 requests per minute
    MIN_DELAY_SECONDS = 20
    MAX_DELAY_SECONDS = 40
    
    def __init__(self, cookies_path: str, headless: bool = True):
        """
        Initialize LinkedIn scraper with session cookies.
        
        Args:
            cookies_path: Path to JSON file with exported cookies
            headless: Run browser in headless mode (default True)
        """
        self.cookies_path = Path(cookies_path)
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self._initialized = False
        self._last_request_time = 0
    
    def _load_cookies(self) -> List[Dict[str, Any]]:
        """Load cookies from JSON file."""
        if not self.cookies_path.exists():
            raise FileNotFoundError(
                f"LinkedIn cookies file not found: {self.cookies_path}\n"
                "Please export your LinkedIn cookies using a browser extension."
            )
        
        with open(self.cookies_path, 'r') as f:
            cookies = json.load(f)
        
        # Convert to Playwright cookie format if needed
        playwright_cookies = []
        for cookie in cookies:
            pc = {
                'name': cookie.get('name'),
                'value': cookie.get('value'),
                'domain': cookie.get('domain', '.linkedin.com'),
                'path': cookie.get('path', '/'),
            }
            
            # Add optional fields
            if 'expires' in cookie or 'expirationDate' in cookie:
                pc['expires'] = cookie.get('expires') or cookie.get('expirationDate')
            if 'httpOnly' in cookie:
                pc['httpOnly'] = cookie['httpOnly']
            if 'secure' in cookie:
                pc['secure'] = cookie['secure']
            if 'sameSite' in cookie:
                pc['sameSite'] = cookie['sameSite']
            
            playwright_cookies.append(pc)
        
        return playwright_cookies
    
    def _init_browser(self):
        """Initialize Playwright browser with LinkedIn cookies."""
        if self._initialized:
            return
        
        cookies = self._load_cookies()
        
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
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
        )
        
        # Add cookies to context
        self.context.add_cookies(cookies)
        
        self.page = self.context.new_page()
        self._initialized = True
        logger.info("LinkedIn scraper initialized with cookies")
    
    def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        self._initialized = False
        logger.info("LinkedIn scraper closed")
    
    def __enter__(self):
        self._init_browser()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        min_wait = random.uniform(self.MIN_DELAY_SECONDS, self.MAX_DELAY_SECONDS)
        
        if elapsed < min_wait:
            wait_time = min_wait - elapsed
            logger.debug(f"Rate limiting: waiting {wait_time:.1f}s")
            time.sleep(wait_time)
        
        self._last_request_time = time.time()
    
    def _human_scroll(self):
        """Simulate human-like scrolling behavior."""
        for _ in range(random.randint(2, 4)):
            scroll_amount = random.randint(200, 500)
            self.page.mouse.wheel(0, scroll_amount)
            time.sleep(random.uniform(0.5, 1.5))
    
    def _random_delay(self, min_sec: float = 0.5, max_sec: float = 2.0):
        """Add a random delay."""
        time.sleep(random.uniform(min_sec, max_sec))
    
    def validate_session(self) -> bool:
        """
        Check if LinkedIn session is still valid.
        
        Returns:
            True if session is valid, False otherwise
        """
        try:
            self._init_browser()
            
            self.page.goto("https://www.linkedin.com/feed/", timeout=30000)
            self._random_delay(2, 3)
            
            # Check if we're on the feed page (logged in)
            if "/feed" in self.page.url and "login" not in self.page.url:
                logger.info("LinkedIn session is valid")
                return True
            else:
                logger.warning("LinkedIn session expired or invalid")
                return False
                
        except Exception as e:
            logger.error(f"Session validation error: {e}")
            return False
    
    def search_profile(self, name: str, company: Optional[str] = None) -> Optional[str]:
        """
        Search for a LinkedIn profile by name and company.
        
        Args:
            name: Person's name
            company: Optional company name for filtering
        
        Returns:
            LinkedIn profile URL or None
        """
        try:
            self._init_browser()
            self._enforce_rate_limit()
            
            # Build search URL
            query = name
            if company:
                query += f" {company}"
            
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            
            logger.debug(f"Searching LinkedIn: {query}")
            
            self.page.goto(search_url, timeout=30000)
            self._random_delay(2, 3)
            self._human_scroll()
            
            # Check for login redirect
            if "login" in self.page.url or "authwall" in self.page.url:
                logger.error("LinkedIn session expired - please re-export cookies")
                return None
            
            # Find first result
            result_links = self.page.locator('a[href*="/in/"]').all()
            
            for link in result_links[:5]:
                href = link.get_attribute("href")
                if href and "/in/" in href and "miniProfile" not in href:
                    # Clean up the URL
                    profile_url = href.split("?")[0]
                    if not profile_url.startswith("http"):
                        profile_url = f"https://www.linkedin.com{profile_url}"
                    return profile_url
            
            logger.debug(f"No LinkedIn profile found for: {name}")
            return None
            
        except Exception as e:
            logger.error(f"LinkedIn search error: {e}")
            return None
    
    def scrape_profile(self, profile_url: str) -> LinkedInResult:
        """
        Scrape data from a LinkedIn profile.
        
        Args:
            profile_url: Full LinkedIn profile URL
        
        Returns:
            LinkedInResult with scraped data
        """
        try:
            self._init_browser()
            self._enforce_rate_limit()
            
            logger.debug(f"Scraping LinkedIn profile: {profile_url}")
            
            self.page.goto(profile_url, timeout=30000)
            self._random_delay(2, 4)
            self._human_scroll()
            
            # Check for login redirect
            if "login" in self.page.url or "authwall" in self.page.url:
                return LinkedInResult(error="Session expired - please re-export cookies")
            
            result = LinkedInResult(linkedin_url=profile_url)
            
            # Extract name (for verification)
            try:
                name_elem = self.page.locator("h1.text-heading-xlarge").first
                if name_elem.count() > 0:
                    name = name_elem.text_content().strip()
                    logger.debug(f"Profile name: {name}")
            except Exception:
                pass
            
            # Extract headline (usually contains job title)
            try:
                headline = self.page.locator("div.text-body-medium").first
                if headline.count() > 0:
                    result.job_title = headline.text_content().strip()
            except Exception:
                pass
            
            # Extract current company from experience section
            try:
                # Look for "Experience" section
                exp_section = self.page.locator("section:has-text('Experience')").first
                if exp_section.count() > 0:
                    company_elem = exp_section.locator("span.t-14.t-normal").first
                    if company_elem.count() > 0:
                        result.company = company_elem.text_content().strip()
            except Exception:
                pass
            
            # Try to get company from headline if not found in experience
            if not result.company and result.job_title:
                # Often formatted as "Title at Company"
                if " at " in result.job_title:
                    parts = result.job_title.split(" at ")
                    if len(parts) >= 2:
                        result.job_title = parts[0].strip()
                        result.company = parts[1].strip()
            
            # Extract location
            try:
                location = self.page.locator("span.text-body-small.inline.t-black--light").first
                if location.count() > 0:
                    result.location = location.text_content().strip()
            except Exception:
                pass
            
            # Extract email from contact info (if available)
            try:
                # Click on "Contact info" link
                contact_link = self.page.locator('a[href*="contact-info"]').first
                if contact_link.count() > 0:
                    contact_link.click()
                    self._random_delay(1, 2)
                    
                    # Look for email in modal
                    email_elem = self.page.locator('a[href^="mailto:"]').first
                    if email_elem.count() > 0:
                        email_href = email_elem.get_attribute("href")
                        if email_href:
                            result.email = email_href.replace("mailto:", "")
                    
                    # Close modal
                    close_btn = self.page.locator('button[aria-label="Dismiss"]').first
                    if close_btn.count() > 0:
                        close_btn.click()
            except Exception as e:
                logger.debug(f"Could not extract contact info: {e}")
            
            # Calculate confidence
            confidence = 0.3  # Base confidence for finding profile
            if result.email:
                confidence += 0.4
            if result.job_title:
                confidence += 0.15
            if result.company:
                confidence += 0.15
            
            result.confidence = min(confidence, 1.0)
            
            return result
            
        except Exception as e:
            logger.error(f"LinkedIn scrape error: {e}")
            return LinkedInResult(error=str(e))
    
    def enrich_contact(self, name: str, company: Optional[str] = None) -> LinkedInResult:
        """
        Full enrichment: search for profile and scrape it.
        
        Args:
            name: Person's name
            company: Optional company name
        
        Returns:
            LinkedInResult with all found data
        """
        # First, search for the profile
        profile_url = self.search_profile(name, company)
        
        if not profile_url:
            return LinkedInResult(error="Profile not found")
        
        # Then scrape the profile
        return self.scrape_profile(profile_url)


if __name__ == "__main__":
    # Test the scraper
    import sys
    
    logging.basicConfig(level=logging.DEBUG)
    
    cookies_file = "linkedin_cookies.json"
    if len(sys.argv) > 1:
        cookies_file = sys.argv[1]
    
    try:
        with LinkedInScraper(cookies_file, headless=False) as scraper:
            # Validate session first
            if not scraper.validate_session():
                print("Session invalid! Please re-export cookies.")
                sys.exit(1)
            
            # Test search and scrape
            result = scraper.enrich_contact("Satya Nadella", "Microsoft")
            print(f"LinkedIn URL: {result.linkedin_url}")
            print(f"Email: {result.email}")
            print(f"Job Title: {result.job_title}")
            print(f"Company: {result.company}")
            print(f"Confidence: {result.confidence}")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
