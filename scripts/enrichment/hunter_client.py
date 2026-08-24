"""
Hunter.io API Client for email finding and verification.

Hunter excels at finding emails from company domains.
Free tier: 25 searches/month + 50 verifications/month
Docs: https://hunter.io/api-documentation/v2
"""

import os
import logging
import requests
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

logger = logging.getLogger(__name__)

HUNTER_API_URL = "https://api.hunter.io/v2"


class HunterAPIError(Exception):
    """Raised for Hunter API errors."""
    pass


class HunterRateLimitError(HunterAPIError):
    """Raised when rate limit is exceeded."""
    pass


class EmailVerificationStatus(Enum):
    """Email verification status from Hunter."""
    VALID = "valid"              # Deliverable
    INVALID = "invalid"          # Undeliverable
    ACCEPT_ALL = "accept_all"    # Server accepts all (risky)
    WEBMAIL = "webmail"          # Personal email (gmail, etc)
    DISPOSABLE = "disposable"    # Temporary email
    UNKNOWN = "unknown"          # Couldn't verify


@dataclass
class HunterContact:
    """Represents an enriched contact from Hunter."""
    name: str
    phone: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    confidence: Optional[float] = None
    raw_response: Optional[dict] = None
    error: Optional[str] = None
    source: str = "hunter"
    # Verification fields
    verification_status: Optional[str] = None
    is_verified: bool = False
    is_deliverable: bool = False
    
    @property
    def is_enriched(self) -> bool:
        """Check if we got any useful data."""
        return bool(self.email)
    
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
            "Verification_Status": self.verification_status or "",
            "Is_Deliverable": "Yes" if self.is_deliverable else "No",
            "Error": self.error or "",
        }


@dataclass
class EmailVerificationResult:
    """Result of email verification."""
    email: str
    status: EmailVerificationStatus
    score: int  # 0-100
    is_deliverable: bool
    is_disposable: bool
    is_webmail: bool
    is_accept_all: bool
    raw_response: Optional[dict] = None
    error: Optional[str] = None


class HunterClient:
    """Client for Hunter.io API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Hunter client.
        
        Args:
            api_key: Hunter API key. If not provided, reads from HUNTER_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("HUNTER_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Hunter API key required. Set HUNTER_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        self.session = requests.Session()
    
    def find_email(
        self,
        name: str,
        domain: str,
        phone: Optional[str] = None,
        company: Optional[str] = None,
    ) -> HunterContact:
        """
        Find email by name and company domain.
        
        Args:
            name: Full name of the person
            domain: Company domain (e.g., 'google.com')
            phone: Phone number (for reference)
            company: Company name (for reference)
        
        Returns:
            HunterContact with email if found
        """
        if not name or not domain:
            return HunterContact(
                name=name,
                phone=phone or "",
                company=company,
                error="Missing name or domain",
            )
        
        # Split name into first/last
        name_parts = name.strip().split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        params = {
            "domain": domain,
            "first_name": first_name,
            "last_name": last_name,
            "api_key": self.api_key,
        }
        
        try:
            response = self.session.get(
                f"{HUNTER_API_URL}/email-finder",
                params=params,
                timeout=30,
            )
            
            if response.status_code == 429:
                logger.warning(f"Hunter rate limit hit for {name}")
                raise HunterRateLimitError("Rate limit exceeded")
            
            if response.status_code == 401:
                return HunterContact(
                    name=name,
                    phone=phone or "",
                    company=company,
                    error="Invalid API key",
                )
            
            if response.status_code == 404 or response.status_code == 400:
                return HunterContact(
                    name=name,
                    phone=phone or "",
                    company=company,
                    error="No match found",
                )
            
            if response.status_code != 200:
                return HunterContact(
                    name=name,
                    phone=phone or "",
                    company=company,
                    error=f"API error: {response.status_code}",
                )
            
            data = response.json()
            return self._parse_email_finder_response(name, phone or "", company, data)
            
        except requests.exceptions.Timeout:
            return HunterContact(
                name=name,
                phone=phone or "",
                company=company,
                error="Request timeout",
            )
        except requests.exceptions.RequestException as e:
            return HunterContact(
                name=name,
                phone=phone or "",
                company=company,
                error=f"Network error: {str(e)}",
            )
    
    def _parse_email_finder_response(
        self,
        name: str,
        phone: str,
        company: Optional[str],
        data: dict,
    ) -> HunterContact:
        """Parse Hunter email finder response."""
        result_data = data.get("data", {})
        
        email = result_data.get("email")
        if not email:
            return HunterContact(
                name=name,
                phone=phone,
                company=company,
                error="No email found",
            )
        
        # Confidence is 0-100, normalize to 0-1
        score = result_data.get("score", 0)
        confidence = score / 100.0 if score else 0.5
        
        # Get position (job title)
        job_title = result_data.get("position")
        
        # Get LinkedIn if available
        linkedin_url = result_data.get("linkedin")
        
        return HunterContact(
            name=name,
            phone=phone,
            email=email,
            linkedin_url=linkedin_url,
            job_title=job_title,
            company=company or result_data.get("company"),
            confidence=confidence,
            raw_response=data,
            source="hunter",
        )
    
    def domain_search(
        self,
        domain: str,
        limit: int = 10,
    ) -> List[HunterContact]:
        """
        Find all emails at a domain.
        
        Args:
            domain: Company domain (e.g., 'google.com')
            limit: Max results to return
        
        Returns:
            List of HunterContact with emails found
        """
        params = {
            "domain": domain,
            "limit": limit,
            "api_key": self.api_key,
        }
        
        try:
            response = self.session.get(
                f"{HUNTER_API_URL}/domain-search",
                params=params,
                timeout=30,
            )
            
            if response.status_code == 429:
                raise HunterRateLimitError("Rate limit exceeded")
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            emails = data.get("data", {}).get("emails", [])
            
            results = []
            for email_data in emails:
                contact = HunterContact(
                    name=f"{email_data.get('first_name', '')} {email_data.get('last_name', '')}".strip(),
                    phone="",
                    email=email_data.get("value"),
                    job_title=email_data.get("position"),
                    company=data.get("data", {}).get("organization"),
                    confidence=(email_data.get("confidence", 0) / 100.0),
                    source="hunter_domain",
                )
                results.append(contact)
            
            return results
            
        except requests.exceptions.RequestException:
            return []
    
    def verify_email(self, email: str) -> EmailVerificationResult:
        """
        Verify if an email address is deliverable.
        
        Args:
            email: Email address to verify
        
        Returns:
            EmailVerificationResult with deliverability info
        """
        if not email:
            return EmailVerificationResult(
                email=email,
                status=EmailVerificationStatus.UNKNOWN,
                score=0,
                is_deliverable=False,
                is_disposable=False,
                is_webmail=False,
                is_accept_all=False,
                error="Missing email",
            )
        
        params = {
            "email": email,
            "api_key": self.api_key,
        }
        
        try:
            response = self.session.get(
                f"{HUNTER_API_URL}/email-verifier",
                params=params,
                timeout=30,
            )
            
            if response.status_code == 429:
                raise HunterRateLimitError("Rate limit exceeded")
            
            if response.status_code != 200:
                return EmailVerificationResult(
                    email=email,
                    status=EmailVerificationStatus.UNKNOWN,
                    score=0,
                    is_deliverable=False,
                    is_disposable=False,
                    is_webmail=False,
                    is_accept_all=False,
                    error=f"API error: {response.status_code}",
                )
            
            data = response.json()
            return self._parse_verification_response(email, data)
            
        except requests.exceptions.Timeout:
            return EmailVerificationResult(
                email=email,
                status=EmailVerificationStatus.UNKNOWN,
                score=0,
                is_deliverable=False,
                is_disposable=False,
                is_webmail=False,
                is_accept_all=False,
                error="Request timeout",
            )
        except requests.exceptions.RequestException as e:
            return EmailVerificationResult(
                email=email,
                status=EmailVerificationStatus.UNKNOWN,
                score=0,
                is_deliverable=False,
                is_disposable=False,
                is_webmail=False,
                is_accept_all=False,
                error=f"Network error: {str(e)}",
            )
    
    def _parse_verification_response(
        self,
        email: str,
        data: dict,
    ) -> EmailVerificationResult:
        """Parse Hunter email verification response."""
        result_data = data.get("data", {})
        
        status_str = result_data.get("status", "unknown")
        try:
            status = EmailVerificationStatus(status_str)
        except ValueError:
            status = EmailVerificationStatus.UNKNOWN
        
        score = result_data.get("score", 0)
        is_deliverable = status == EmailVerificationStatus.VALID or (
            status == EmailVerificationStatus.ACCEPT_ALL and score >= 50
        )
        
        return EmailVerificationResult(
            email=email,
            status=status,
            score=score,
            is_deliverable=is_deliverable,
            is_disposable=result_data.get("disposable", False),
            is_webmail=result_data.get("webmail", False),
            is_accept_all=status == EmailVerificationStatus.ACCEPT_ALL,
            raw_response=data,
        )
    
    def find_and_verify(
        self,
        name: str,
        domain: str,
        phone: Optional[str] = None,
        company: Optional[str] = None,
    ) -> HunterContact:
        """
        Find email and verify it in one call.
        
        Args:
            name: Full name of the person
            domain: Company domain
            phone: Phone number (for reference)
            company: Company name (for reference)
        
        Returns:
            HunterContact with email and verification status
        """
        # First find the email
        contact = self.find_email(name, domain, phone, company)
        
        if not contact.email:
            return contact
        
        # Then verify it
        verification = self.verify_email(contact.email)
        
        contact.verification_status = verification.status.value
        contact.is_verified = True
        contact.is_deliverable = verification.is_deliverable
        
        # Adjust confidence based on verification
        if verification.is_deliverable:
            contact.confidence = min((contact.confidence or 0.5) + 0.2, 1.0)
        elif verification.status == EmailVerificationStatus.INVALID:
            contact.confidence = 0.1
            contact.error = "Email undeliverable"
        
        return contact


if __name__ == "__main__":
    # Test the client
    from dotenv import load_dotenv
    load_dotenv()
    
    logging.basicConfig(level=logging.INFO)
    
    try:
        client = HunterClient()
        print("Hunter Client initialized successfully!")
        print(f"API Key: {client.api_key[:8]}...")
        
        # Test email verification
        result = client.verify_email("test@example.com")
        print(f"Verification result: {result}")
    except ValueError as e:
        print(f"Error: {e}")
