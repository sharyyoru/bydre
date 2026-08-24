"""
LinkedIn session management utilities.
Validates and manages LinkedIn session cookies for scraping.
"""

import json
import logging
import sys
from pathlib import Path
from typing import Optional, Dict, List, Any

from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

DEFAULT_COOKIES_FILE = "linkedin_cookies.json"


def load_cookies(cookies_path: str = DEFAULT_COOKIES_FILE) -> List[Dict[str, Any]]:
    """
    Load cookies from JSON file.
    
    Args:
        cookies_path: Path to cookies JSON file
    
    Returns:
        List of cookie dicts in Playwright format
    
    Raises:
        FileNotFoundError: If cookies file doesn't exist
        json.JSONDecodeError: If cookies file is invalid JSON
    """
    path = Path(cookies_path)
    
    if not path.exists():
        raise FileNotFoundError(
            f"Cookies file not found: {cookies_path}\n"
            "Please export your LinkedIn cookies using a browser extension like 'EditThisCookie'."
        )
    
    with open(path, 'r', encoding='utf-8') as f:
        cookies = json.load(f)
    
    # Convert to Playwright format if needed (handle EditThisCookie format)
    playwright_cookies = []
    for cookie in cookies:
        pc = {
            'name': cookie.get('name'),
            'value': cookie.get('value'),
            'domain': cookie.get('domain', '.linkedin.com'),
            'path': cookie.get('path', '/'),
        }
        
        # Handle expiration
        if 'expirationDate' in cookie:
            pc['expires'] = cookie['expirationDate']
        elif 'expires' in cookie:
            pc['expires'] = cookie['expires']
        
        # Optional fields
        if 'httpOnly' in cookie:
            pc['httpOnly'] = cookie['httpOnly']
        if 'secure' in cookie:
            pc['secure'] = cookie['secure']
        if 'sameSite' in cookie:
            # Playwright expects 'Strict', 'Lax', or 'None'
            same_site = cookie['sameSite']
            if isinstance(same_site, str):
                pc['sameSite'] = same_site.capitalize()
        
        playwright_cookies.append(pc)
    
    logger.info(f"Loaded {len(playwright_cookies)} cookies from {cookies_path}")
    return playwright_cookies


def validate_session(cookies_path: str = DEFAULT_COOKIES_FILE, headless: bool = True) -> bool:
    """
    Validate LinkedIn session by attempting to load the feed.
    
    Args:
        cookies_path: Path to cookies JSON file
        headless: Run browser in headless mode
    
    Returns:
        True if session is valid, False otherwise
    """
    try:
        cookies = load_cookies(cookies_path)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Failed to load cookies: {e}")
        return False
    
    playwright = None
    browser = None
    
    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(
            headless=headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        )
        
        # Add cookies
        context.add_cookies(cookies)
        
        page = context.new_page()
        
        # Try to load the feed page
        logger.info("Checking LinkedIn session...")
        page.goto("https://www.linkedin.com/feed/", timeout=30000)
        
        # Wait for navigation to complete
        page.wait_for_load_state('networkidle', timeout=10000)
        
        current_url = page.url
        
        # Check if we're logged in (on feed page, not login/authwall)
        if '/feed' in current_url and 'login' not in current_url and 'authwall' not in current_url:
            logger.info("✓ LinkedIn session is VALID")
            return True
        else:
            logger.warning(f"✗ LinkedIn session is INVALID (redirected to: {current_url})")
            return False
            
    except Exception as e:
        logger.error(f"Session validation error: {e}")
        return False
        
    finally:
        if browser:
            browser.close()
        if playwright:
            playwright.stop()


def get_session_info(cookies_path: str = DEFAULT_COOKIES_FILE) -> Dict[str, Any]:
    """
    Get information about the LinkedIn session.
    
    Args:
        cookies_path: Path to cookies JSON file
    
    Returns:
        Dict with session info
    """
    try:
        cookies = load_cookies(cookies_path)
    except FileNotFoundError:
        return {
            'status': 'missing',
            'error': f'Cookies file not found: {cookies_path}',
            'cookies_count': 0,
        }
    except json.JSONDecodeError as e:
        return {
            'status': 'invalid',
            'error': f'Invalid JSON in cookies file: {e}',
            'cookies_count': 0,
        }
    
    # Find key cookies
    li_at = None
    jsessionid = None
    
    for cookie in cookies:
        name = cookie.get('name', '')
        if name == 'li_at':
            li_at = cookie.get('value', '')[:20] + '...'  # Truncate for security
        elif name == 'JSESSIONID':
            jsessionid = cookie.get('value', '')[:20] + '...'
    
    return {
        'status': 'loaded',
        'cookies_count': len(cookies),
        'has_li_at': li_at is not None,
        'has_jsessionid': jsessionid is not None,
        'li_at_preview': li_at,
        'jsessionid_preview': jsessionid,
    }


def print_cookie_export_instructions():
    """Print instructions for exporting LinkedIn cookies."""
    instructions = """
╔══════════════════════════════════════════════════════════════════╗
║                  LinkedIn Cookie Export Guide                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Option 1: Using EditThisCookie (Chrome Extension)                ║
║  ─────────────────────────────────────────────────────────────    ║
║  1. Install "EditThisCookie" from Chrome Web Store                ║
║  2. Go to https://www.linkedin.com and log in                     ║
║  3. Click the EditThisCookie extension icon                       ║
║  4. Click "Export" (clipboard icon)                               ║
║  5. Paste into a file named: linkedin_cookies.json                ║
║                                                                    ║
║  Option 2: Using Browser DevTools                                  ║
║  ─────────────────────────────────────────────────────────────    ║
║  1. Go to https://www.linkedin.com and log in                     ║
║  2. Press F12 to open DevTools                                    ║
║  3. Go to Application tab → Cookies → linkedin.com               ║
║  4. Right-click → Copy all as JSON (if available)                 ║
║  5. Or manually copy the key cookies:                              ║
║     - li_at                                                        ║
║     - JSESSIONID                                                   ║
║     - lidc                                                         ║
║                                                                    ║
║  Save to: scripts/enrichment/linkedin_cookies.json               ║
║                                                                    ║
╚══════════════════════════════════════════════════════════════════╝
"""
    print(instructions)


def create_sample_cookies_file(output_path: str = "linkedin_cookies.example.json"):
    """Create a sample cookies file showing the expected format."""
    sample = [
        {
            "name": "li_at",
            "value": "YOUR_LI_AT_COOKIE_VALUE_HERE",
            "domain": ".linkedin.com",
            "path": "/",
            "secure": True,
            "httpOnly": True,
            "expirationDate": 1735689600
        },
        {
            "name": "JSESSIONID",
            "value": "YOUR_JSESSIONID_VALUE_HERE",
            "domain": ".linkedin.com",
            "path": "/",
            "secure": True,
            "httpOnly": False
        },
        {
            "name": "lidc",
            "value": "YOUR_LIDC_VALUE_HERE",
            "domain": ".linkedin.com",
            "path": "/",
            "secure": True,
            "httpOnly": False
        }
    ]
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sample, f, indent=2)
    
    print(f"Sample cookies file created: {output_path}")
    print("Replace the placeholder values with your actual LinkedIn cookies.")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s | %(levelname)s | %(message)s'
    )
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'validate':
            cookies_file = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_COOKIES_FILE
            is_valid = validate_session(cookies_file, headless=True)
            sys.exit(0 if is_valid else 1)
        
        elif command == 'info':
            cookies_file = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_COOKIES_FILE
            info = get_session_info(cookies_file)
            print("\nLinkedIn Session Info:")
            for key, value in info.items():
                print(f"  {key}: {value}")
        
        elif command == 'instructions':
            print_cookie_export_instructions()
        
        elif command == 'sample':
            output = sys.argv[2] if len(sys.argv) > 2 else "linkedin_cookies.example.json"
            create_sample_cookies_file(output)
        
        else:
            print(f"Unknown command: {command}")
            print("Usage: python linkedin_session.py [validate|info|instructions|sample]")
            sys.exit(1)
    else:
        # Default: show info and validate
        print_cookie_export_instructions()
        
        print("\n" + "="*60)
        print("Checking current session...")
        print("="*60 + "\n")
        
        info = get_session_info()
        print("Session Info:")
        for key, value in info.items():
            print(f"  {key}: {value}")
        
        if info['status'] == 'loaded':
            print("\nValidating session...")
            is_valid = validate_session(headless=True)
            if not is_valid:
                print("\n⚠️  Session expired! Please re-export your LinkedIn cookies.")
