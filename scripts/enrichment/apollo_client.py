"""
Apollo.io API Client for contact enrichment.

Apollo has 270M+ contacts with strong email coverage.
Free tier: 50 credits/month
Docs: https://apolloio.github.io/apollo-api-docs/
"""

import os
import logging
import requests
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

APOLLO_API_URL = "https://api.apollo.io/v1"


class ApolloAPIError(Exception):
    """Raised for Apollo API errors."""
    pass


class ApolloRateLimitError(ApolloAPIError):
    """Raised when rate limit is exceeded."""
    pass


@dataclass
class ApolloContact:
    """Represents an enriched contact from Apollo."""
    name: str
    phone: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    confidence: Optional[float] = None
    raw_response: Optional[dict] = None
    error: Optional[str] = None
    source: str = "apollo"
    
    @property
    def is_enriched(self) -> bool:
        """Check if we got any useful data."""
        return bool(self.email or self.linkedin_url)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for CSV export."""
        return {
            "Name": self.name,
            "Phone_Number": self.phone,
            "Email": self.email or "",
            "LinkedIn_URL": self.linkedin_url or "",
            "Job_Title": self.job_title or "",
            "Company": self.company or "",
            "Confidence": self.confidence or "",
            "Source": self.source,
            "Error": self.error or "",
        }


class ApolloClient:
    """Client for Apollo.io API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Apollo client.
        
        Args:
            api_key: Apollo API key. If not provided, reads from APOLLO_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("APOLLO_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Apollo API key required. Set APOLLO_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        })
    
    def search_person(
        self,
        name: str,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        domain: Optional[str] = None,
    ) -> ApolloContact:
        """
        Search for a person by name and optional company/domain.
        
        Args:
            name: Full name of the person
            phone: Phone number (for reference, not searchable)
            company: Company name to narrow search
            domain: Company domain to narrow search
        
        Returns:
            ApolloContact with available data
        """
        if not name:
            return ApolloContact(
                name=name,
                phone=phone or "",
                error="Missing name",
            )
        
        # Split name into first/last
        name_parts = name.strip().split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        # Build search query
        payload = {
            "api_key": self.api_key,
            "first_name": first_name,
            "last_name": last_name,
            "per_page": 1,
        }
        
        # Add company filters if available
        if domain:
            payload["organization_domains"] = [domain]
        elif company:
            payload["organization_name"] = company
        
        try:
            response = self.session.post(
                f"{APOLLO_API_URL}/people/search",
                json=payload,
                timeout=30,
            )
            
            if response.status_code == 429:
                logger.warning(f"Apollo rate limit hit for {name}")
                raise ApolloRateLimitError("Rate limit exceeded")
            
            if response.status_code == 401:
                return ApolloContact(
                    name=name,
                    phone=phone or "",
                    error="Invalid API key",
                )
            
            if response.status_code >= 500:
                logger.error(f"Apollo server error: {response.status_code}")
                raise ApolloAPIError(f"Server error: {response.status_code}")
            
            if response.status_code != 200:
                return ApolloContact(
                    name=name,
                    phone=phone or "",
                    error=f"API error: {response.status_code}",
                )
            
            data = response.json()
            return self._parse_search_response(name, phone or "", data)
            
        except requests.exceptions.Timeout:
            return ApolloContact(
                name=name,
                phone=phone or "",
                error="Request timeout",
            )
        except requests.exceptions.RequestException as e:
            return ApolloContact(
                name=name,
                phone=phone or "",
                error=f"Network error: {str(e)}",
            )
    
    def _parse_search_response(
        self,
        name: str,
        phone: str,
        data: dict,
    ) -> ApolloContact:
        """Parse Apollo search API response."""
        people = data.get("people", [])
        
        if not people:
            return ApolloContact(
                name=name,
                phone=phone,
                error="No match found",
            )
        
        # Get the best match (first result)
        person = people[0]
        
        # Extract email
        email = person.get("email")
        
        # Extract LinkedIn URL
        linkedin_url = person.get("linkedin_url")
        
        # Extract job info
        job_title = person.get("title")
        company = person.get("organization", {}).get("name") if person.get("organization") else None
        
        # Apollo doesn't provide a confidence score, use presence of email as indicator
        confidence = 0.8 if email else 0.5
        
        return ApolloContact(
            name=name,
            phone=phone,
            email=email,
            linkedin_url=linkedin_url,
            job_title=job_title,
            company=company,
            confidence=confidence,
            raw_response=data,
            source="apollo",
        )
    
    def enrich_by_email(self, email: str, name: str = "", phone: str = "") -> ApolloContact:
        """
        Enrich a contact by email address.
        Useful for getting additional data when email is already known.
        
        Args:
            email: Email address to look up
            name: Original name (for reference)
            phone: Original phone (for reference)
        
        Returns:
            ApolloContact with enriched data
        """
        if not email:
            return ApolloContact(
                name=name,
                phone=phone,
                error="Missing email",
            )
        
        payload = {
            "api_key": self.api_key,
            "email": email,
        }
        
        try:
            response = self.session.post(
                f"{APOLLO_API_URL}/people/match",
                json=payload,
                timeout=30,
            )
            
            if response.status_code == 429:
                raise ApolloRateLimitError("Rate limit exceeded")
            
            if response.status_code == 404:
                return ApolloContact(
                    name=name,
                    phone=phone,
                    email=email,
                    error="No match found",
                )
            
            if response.status_code != 200:
                return ApolloContact(
                    name=name,
                    phone=phone,
                    email=email,
                    error=f"API error: {response.status_code}",
                )
            
            data = response.json()
            person = data.get("person", {})
            
            return ApolloContact(
                name=person.get("name") or name,
                phone=phone,
                email=person.get("email") or email,
                linkedin_url=person.get("linkedin_url"),
                job_title=person.get("title"),
                company=person.get("organization", {}).get("name") if person.get("organization") else None,
                confidence=0.9,
                raw_response=data,
                source="apollo",
            )
            
        except requests.exceptions.RequestException as e:
            return ApolloContact(
                name=name,
                phone=phone,
                email=email,
                error=f"Network error: {str(e)}",
            )


if __name__ == "__main__":
    # Test the client
    from dotenv import load_dotenv
    load_dotenv()
    
    logging.basicConfig(level=logging.INFO)
    
    try:
        client = ApolloClient()
        print("Apollo Client initialized successfully!")
        print(f"API Key: {client.api_key[:8]}...")
        
        # Test search
        result = client.search_person(
            name="Test User",
            company="Google",
        )
        print(f"Test result: {result}")
    except ValueError as e:
        print(f"Error: {e}")
