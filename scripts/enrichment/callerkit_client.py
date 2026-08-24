"""
CallerKit API Client - Specializes in Middle East / GCC Phone Lookups
https://caller-kit.com/

Best coverage for: Qatar, UAE, Saudi, Bahrain, Kuwait, Oman, Egypt, Jordan
Returns: Name, Aliases, Company, Email (if available), Social profiles
"""

import os
import httpx
import asyncio
from dataclasses import dataclass
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

CALLERKIT_API_KEY = os.getenv("CALLERKIT_API_KEY")
CALLERKIT_BASE_URL = "https://api.caller-kit.com/v1"


@dataclass
class CallerKitContact:
    """Contact data from CallerKit reverse phone lookup"""
    phone: str
    primary_name: Optional[str] = None
    aliases: Optional[List[str]] = None
    email: Optional[str] = None
    company: Optional[str] = None
    carrier: Optional[str] = None
    country: Optional[str] = None
    social_profiles: Optional[dict] = None
    spam_count: Optional[int] = None
    confidence: Optional[float] = None


class CallerKitClient:
    """
    CallerKit API Client for GCC phone number enrichment
    
    Pricing (as of 2024):
    - Dev Mode: 10 free requests
    - Pro: $99/month for 20,000 requests
    - Enterprise: Custom pricing
    
    Best for: Qatar, UAE, Saudi Arabia, Bahrain, Kuwait, Oman
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or CALLERKIT_API_KEY
        if not self.api_key:
            raise ValueError("CallerKit API key required. Set CALLERKIT_API_KEY env var.")
        
        self.client = httpx.AsyncClient(
            base_url=CALLERKIT_BASE_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    async def lookup_phone(self, phone: str) -> Optional[CallerKitContact]:
        """
        Reverse lookup a phone number to get contact details.
        
        Args:
            phone: Phone number (with or without +)
            
        Returns:
            CallerKitContact with name, company, email, social profiles
        """
        # Normalize phone number
        phone_clean = phone.replace(" ", "").replace("-", "")
        if not phone_clean.startswith("+"):
            phone_clean = f"+{phone_clean}"
        
        try:
            response = await self.client.get(
                "/phone/lookup",
                params={"phone": phone_clean}
            )
            
            if response.status_code == 404:
                return None
            
            if response.status_code == 429:
                print("CallerKit rate limit hit")
                return None
                
            response.raise_for_status()
            data = response.json()
            
            return CallerKitContact(
                phone=phone,
                primary_name=data.get("name") or data.get("primary_name"),
                aliases=data.get("aliases", []),
                email=data.get("email"),
                company=data.get("company") or data.get("organization"),
                carrier=data.get("carrier"),
                country=data.get("country"),
                social_profiles=data.get("social_profiles", {}),
                spam_count=data.get("spam_count", 0),
                confidence=data.get("confidence")
            )
            
        except httpx.HTTPStatusError as e:
            print(f"CallerKit API error: {e.response.status_code}")
            return None
        except Exception as e:
            print(f"CallerKit error: {e}")
            return None
    
    async def search_by_name(self, name: str, country: str = "QA") -> List[CallerKitContact]:
        """
        Search for contacts by name (requires Pro plan).
        
        Args:
            name: Person's name to search
            country: ISO 2-letter country code (QA, AE, SA, etc.)
            
        Returns:
            List of matching contacts
        """
        try:
            response = await self.client.get(
                "/name/search",
                params={
                    "name": name,
                    "country": country
                }
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            results = data.get("results", [])
            
            return [
                CallerKitContact(
                    phone=r.get("phone", ""),
                    primary_name=r.get("name"),
                    aliases=r.get("aliases", []),
                    email=r.get("email"),
                    company=r.get("company"),
                    confidence=r.get("confidence")
                )
                for r in results
            ]
            
        except Exception as e:
            print(f"CallerKit name search error: {e}")
            return []
    
    async def bulk_lookup(self, phones: List[str]) -> List[CallerKitContact]:
        """
        Bulk lookup multiple phone numbers.
        
        Args:
            phones: List of phone numbers
            
        Returns:
            List of CallerKitContact results
        """
        results = []
        
        # Process in batches to respect rate limits
        batch_size = 10
        for i in range(0, len(phones), batch_size):
            batch = phones[i:i + batch_size]
            
            # Run batch concurrently
            tasks = [self.lookup_phone(phone) for phone in batch]
            batch_results = await asyncio.gather(*tasks)
            
            for result in batch_results:
                if result:
                    results.append(result)
            
            # Rate limiting between batches
            if i + batch_size < len(phones):
                await asyncio.sleep(1.0)
        
        return results
    
    async def close(self):
        await self.client.aclose()


# Example usage
async def main():
    client = CallerKitClient()
    
    # Test with Qatar number
    result = await client.lookup_phone("+97433453304")
    if result:
        print(f"Name: {result.primary_name}")
        print(f"Company: {result.company}")
        print(f"Email: {result.email}")
        print(f"Social: {result.social_profiles}")
    else:
        print("No result found")
    
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
