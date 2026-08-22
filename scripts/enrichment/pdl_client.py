"""
People Data Labs API client wrapper.
Handles person identification by name and phone number.
"""

import os
import logging
from dataclasses import dataclass
from typing import Optional

import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logger = logging.getLogger(__name__)

# PDL API endpoints
PDL_IDENTIFY_URL = "https://api.peopledatalabs.com/v5/person/identify"
PDL_ENRICH_URL = "https://api.peopledatalabs.com/v5/person/enrich"


class PDLRateLimitError(Exception):
    """Raised when PDL rate limit is hit."""
    pass


class PDLAPIError(Exception):
    """Raised for general PDL API errors."""
    pass


@dataclass
class EnrichedContact:
    """Represents an enriched contact from PDL."""
    name: str
    phone: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    confidence: Optional[float] = None
    raw_response: Optional[dict] = None
    error: Optional[str] = None
    
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
            "Error": self.error or "",
        }


class PDLClient:
    """Client for People Data Labs API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize PDL client.
        
        Args:
            api_key: PDL API key. If not provided, reads from PDL_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("PDL_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "PDL API key required. Set PDL_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        self.session = requests.Session()
        self.session.headers.update({
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json",
        })
    
    @retry(
        retry=retry_if_exception_type(PDLRateLimitError),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        stop=stop_after_attempt(5),
        before_sleep=lambda retry_state: logger.warning(
            f"Rate limited. Retrying in {retry_state.next_action.sleep} seconds..."
        ),
    )
    def identify_person(
        self,
        name: str,
        phone: str,
        min_likelihood: int = 2,
    ) -> EnrichedContact:
        """
        Identify a person by name and phone number.
        
        Args:
            name: Full name of the person
            phone: Phone number in E.164 format
            min_likelihood: Minimum likelihood score (1-10, default 2)
        
        Returns:
            EnrichedContact with available data
        """
        if not name or not phone:
            return EnrichedContact(
                name=name,
                phone=phone,
                error="Missing name or phone",
            )
        
        payload = {
            "phone": phone,
            "name": name,
            "min_likelihood": min_likelihood,
        }
        
        try:
            response = self.session.post(
                PDL_IDENTIFY_URL,
                json=payload,
                timeout=30,
            )
            
            # Handle rate limiting
            if response.status_code == 429:
                logger.warning(f"Rate limit hit for {name}")
                raise PDLRateLimitError("Rate limit exceeded")
            
            # Handle other errors
            if response.status_code >= 500:
                logger.error(f"PDL server error: {response.status_code}")
                raise PDLAPIError(f"Server error: {response.status_code}")
            
            if response.status_code == 404:
                return EnrichedContact(
                    name=name,
                    phone=phone,
                    error="No match found",
                )
            
            if response.status_code != 200:
                error_msg = response.json().get("error", {}).get("message", "Unknown error")
                return EnrichedContact(
                    name=name,
                    phone=phone,
                    error=f"API error: {error_msg}",
                )
            
            data = response.json()
            return self._parse_identify_response(name, phone, data)
            
        except requests.exceptions.Timeout:
            return EnrichedContact(
                name=name,
                phone=phone,
                error="Request timeout",
            )
        except requests.exceptions.RequestException as e:
            return EnrichedContact(
                name=name,
                phone=phone,
                error=f"Network error: {str(e)}",
            )
    
    def _parse_identify_response(
        self,
        name: str,
        phone: str,
        data: dict,
    ) -> EnrichedContact:
        """Parse PDL identify API response."""
        matches = data.get("matches", [])
        
        if not matches:
            return EnrichedContact(
                name=name,
                phone=phone,
                error="No matches in response",
            )
        
        # Get the best match (first one, highest confidence)
        best_match = matches[0]
        person_data = best_match.get("data", {})
        
        # Extract email (prefer work email, then personal)
        email = None
        work_email = person_data.get("work_email")
        personal_emails = person_data.get("personal_emails", [])
        
        if work_email:
            email = work_email
        elif personal_emails:
            email = personal_emails[0]
        
        # Extract LinkedIn URL
        linkedin_url = person_data.get("linkedin_url")
        
        # Extract job info
        job_title = person_data.get("job_title")
        company = person_data.get("job_company_name")
        
        # Get confidence score
        confidence = best_match.get("match_score")
        
        return EnrichedContact(
            name=name,
            phone=phone,
            email=email,
            linkedin_url=linkedin_url,
            job_title=job_title,
            company=company,
            confidence=confidence,
            raw_response=data,
        )
    
    def enrich_person(
        self,
        name: str,
        phone: str,
    ) -> EnrichedContact:
        """
        Alternative: Use the enrich endpoint instead of identify.
        This may provide different/additional data.
        """
        if not name or not phone:
            return EnrichedContact(
                name=name,
                phone=phone,
                error="Missing name or phone",
            )
        
        payload = {
            "phone": phone,
            "name": name,
        }
        
        try:
            response = self.session.get(
                PDL_ENRICH_URL,
                params=payload,
                timeout=30,
            )
            
            if response.status_code == 429:
                raise PDLRateLimitError("Rate limit exceeded")
            
            if response.status_code == 404:
                return EnrichedContact(
                    name=name,
                    phone=phone,
                    error="No match found",
                )
            
            if response.status_code != 200:
                return EnrichedContact(
                    name=name,
                    phone=phone,
                    error=f"API error: {response.status_code}",
                )
            
            data = response.json()
            return self._parse_enrich_response(name, phone, data)
            
        except requests.exceptions.RequestException as e:
            return EnrichedContact(
                name=name,
                phone=phone,
                error=f"Network error: {str(e)}",
            )
    
    def _parse_enrich_response(
        self,
        name: str,
        phone: str,
        data: dict,
    ) -> EnrichedContact:
        """Parse PDL enrich API response."""
        # Enrich endpoint returns data directly, not in matches array
        email = data.get("work_email") or (
            data.get("personal_emails", [None])[0]
        )
        
        return EnrichedContact(
            name=name,
            phone=phone,
            email=email,
            linkedin_url=data.get("linkedin_url"),
            job_title=data.get("job_title"),
            company=data.get("job_company_name"),
            confidence=data.get("likelihood"),
            raw_response=data,
        )


if __name__ == "__main__":
    # Test the client
    from dotenv import load_dotenv
    load_dotenv()
    
    logging.basicConfig(level=logging.INFO)
    
    try:
        client = PDLClient()
        print("PDL Client initialized successfully!")
        print(f"API Key: {client.api_key[:8]}...")
    except ValueError as e:
        print(f"Error: {e}")
