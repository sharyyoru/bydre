"""
Multi-Provider Enrichment Orchestrator.

Combines PDL, Apollo, and Hunter APIs with fallback chain logic.
Falls through providers until email is found, then verifies it.

Fallback Order:
1. PDL (People Data Labs) - Best for phone-based lookup
2. Apollo.io - Best for name + company search
3. Hunter.io - Best for domain-based email lookup
4. Verify found email with Hunter verifier
"""

import os
import logging
import time
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum

# Import provider clients
try:
    from pdl_client import PDLClient, EnrichedContact as PDLContact
except ImportError:
    PDLClient = None
    PDLContact = None

try:
    from apollo_client import ApolloClient, ApolloContact
except ImportError:
    ApolloClient = None
    ApolloContact = None

try:
    from hunter_client import HunterClient, HunterContact, EmailVerificationResult
except ImportError:
    HunterClient = None
    HunterContact = None
    EmailVerificationResult = None

logger = logging.getLogger(__name__)


class Provider(Enum):
    """Available enrichment providers."""
    PDL = "pdl"
    APOLLO = "apollo"
    HUNTER = "hunter"


@dataclass
class EnrichmentResult:
    """Unified result from multi-provider enrichment."""
    name: str
    phone: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    confidence: Optional[float] = None
    source: Optional[str] = None  # Which provider found the email
    providers_tried: List[str] = field(default_factory=list)
    # Verification
    is_verified: bool = False
    verification_status: Optional[str] = None
    is_deliverable: bool = False
    # Metadata
    error: Optional[str] = None
    raw_responses: Dict[str, Any] = field(default_factory=dict)
    
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
            "Email_Source": self.source or "",
            "LinkedIn_URL": self.linkedin_url or "",
            "Job_Title": self.job_title or "",
            "Company": self.company or "",
            "Confidence": f"{self.confidence:.2f}" if self.confidence else "",
            "Providers_Tried": ",".join(self.providers_tried),
            "Is_Verified": "Yes" if self.is_verified else "No",
            "Verification_Status": self.verification_status or "",
            "Is_Deliverable": "Yes" if self.is_deliverable else "No",
            "Error": self.error or "",
        }


class MultiProviderEnricher:
    """
    Orchestrates multiple enrichment providers with fallback logic.
    """
    
    def __init__(
        self,
        pdl_api_key: Optional[str] = None,
        apollo_api_key: Optional[str] = None,
        hunter_api_key: Optional[str] = None,
        enabled_providers: Optional[List[str]] = None,
        verify_emails: bool = True,
        rate_limit_ms: int = 200,
    ):
        """
        Initialize multi-provider enricher.
        
        Args:
            pdl_api_key: PDL API key (or from PDL_API_KEY env)
            apollo_api_key: Apollo API key (or from APOLLO_API_KEY env)
            hunter_api_key: Hunter API key (or from HUNTER_API_KEY env)
            enabled_providers: List of providers to use (default: all available)
            verify_emails: Whether to verify found emails with Hunter
            rate_limit_ms: Delay between API calls in milliseconds
        """
        self.clients: Dict[str, Any] = {}
        self.enabled_providers = enabled_providers or ["pdl", "apollo", "hunter"]
        self.verify_emails = verify_emails
        self.rate_limit_ms = rate_limit_ms
        
        # Initialize available clients
        self._init_clients(pdl_api_key, apollo_api_key, hunter_api_key)
        
        logger.info(f"MultiProviderEnricher initialized with: {list(self.clients.keys())}")
    
    def _init_clients(
        self,
        pdl_api_key: Optional[str],
        apollo_api_key: Optional[str],
        hunter_api_key: Optional[str],
    ):
        """Initialize provider clients based on available API keys."""
        
        # PDL
        if "pdl" in self.enabled_providers:
            key = pdl_api_key or os.getenv("PDL_API_KEY")
            if key and PDLClient:
                try:
                    self.clients["pdl"] = PDLClient(api_key=key)
                    logger.info("PDL client initialized")
                except Exception as e:
                    logger.warning(f"Failed to init PDL: {e}")
        
        # Apollo
        if "apollo" in self.enabled_providers:
            key = apollo_api_key or os.getenv("APOLLO_API_KEY")
            if key and ApolloClient:
                try:
                    self.clients["apollo"] = ApolloClient(api_key=key)
                    logger.info("Apollo client initialized")
                except Exception as e:
                    logger.warning(f"Failed to init Apollo: {e}")
        
        # Hunter
        if "hunter" in self.enabled_providers:
            key = hunter_api_key or os.getenv("HUNTER_API_KEY")
            if key and HunterClient:
                try:
                    self.clients["hunter"] = HunterClient(api_key=key)
                    logger.info("Hunter client initialized")
                except Exception as e:
                    logger.warning(f"Failed to init Hunter: {e}")
    
    def _rate_limit(self):
        """Apply rate limiting between API calls."""
        if self.rate_limit_ms > 0:
            time.sleep(self.rate_limit_ms / 1000)
    
    def enrich_contact(
        self,
        name: str,
        phone: str,
        company: Optional[str] = None,
        domain: Optional[str] = None,
    ) -> EnrichmentResult:
        """
        Enrich a contact using multiple providers with fallback.
        
        Fallback order: PDL → Apollo → Hunter
        
        Args:
            name: Full name of the person
            phone: Phone number (E.164 format preferred)
            company: Company name (improves matching)
            domain: Company domain (required for Hunter)
        
        Returns:
            EnrichmentResult with best available data
        """
        result = EnrichmentResult(
            name=name,
            phone=phone,
            company=company,
        )
        
        # Try PDL first (best for phone lookup)
        if "pdl" in self.clients and phone:
            self._rate_limit()
            pdl_result = self._try_pdl(name, phone)
            result.providers_tried.append("pdl")
            
            if pdl_result and pdl_result.get("email"):
                result.email = pdl_result["email"]
                result.linkedin_url = pdl_result.get("linkedin_url")
                result.job_title = pdl_result.get("job_title")
                result.company = pdl_result.get("company") or company
                result.confidence = pdl_result.get("confidence")
                result.source = "pdl"
                result.raw_responses["pdl"] = pdl_result
        
        # Try Apollo if no email yet
        if not result.email and "apollo" in self.clients:
            self._rate_limit()
            apollo_result = self._try_apollo(name, phone, company, domain)
            result.providers_tried.append("apollo")
            
            if apollo_result and apollo_result.get("email"):
                result.email = apollo_result["email"]
                result.linkedin_url = result.linkedin_url or apollo_result.get("linkedin_url")
                result.job_title = result.job_title or apollo_result.get("job_title")
                result.company = result.company or apollo_result.get("company")
                result.confidence = apollo_result.get("confidence")
                result.source = "apollo"
                result.raw_responses["apollo"] = apollo_result
        
        # Try Hunter if no email yet and domain is available
        if not result.email and "hunter" in self.clients and domain:
            self._rate_limit()
            hunter_result = self._try_hunter(name, domain, phone, company)
            result.providers_tried.append("hunter")
            
            if hunter_result and hunter_result.get("email"):
                result.email = hunter_result["email"]
                result.linkedin_url = result.linkedin_url or hunter_result.get("linkedin_url")
                result.job_title = result.job_title or hunter_result.get("job_title")
                result.company = result.company or hunter_result.get("company")
                result.confidence = hunter_result.get("confidence")
                result.source = "hunter"
                result.raw_responses["hunter"] = hunter_result
        
        # Verify email if found and verification is enabled
        if result.email and self.verify_emails and "hunter" in self.clients:
            self._rate_limit()
            verification = self._verify_email(result.email)
            result.is_verified = True
            result.verification_status = verification.get("status")
            result.is_deliverable = verification.get("is_deliverable", False)
            
            # Adjust confidence based on verification
            if result.is_deliverable:
                result.confidence = min((result.confidence or 0.5) + 0.1, 1.0)
            elif verification.get("status") == "invalid":
                result.confidence = 0.1
                result.error = "Email undeliverable"
        
        # Set error if no data found
        if not result.is_enriched:
            result.error = "No match found in any provider"
        
        return result
    
    def _try_pdl(self, name: str, phone: str) -> Optional[Dict]:
        """Try PDL enrichment."""
        try:
            client = self.clients["pdl"]
            contact = client.identify_person(name=name, phone=phone)
            
            if contact.is_enriched:
                return {
                    "email": contact.email,
                    "linkedin_url": contact.linkedin_url,
                    "job_title": contact.job_title,
                    "company": contact.company,
                    "confidence": contact.confidence,
                }
        except Exception as e:
            logger.warning(f"PDL error for {name}: {e}")
        
        return None
    
    def _try_apollo(
        self,
        name: str,
        phone: str,
        company: Optional[str],
        domain: Optional[str],
    ) -> Optional[Dict]:
        """Try Apollo enrichment."""
        try:
            client = self.clients["apollo"]
            contact = client.search_person(
                name=name,
                phone=phone,
                company=company,
                domain=domain,
            )
            
            if contact.is_enriched:
                return {
                    "email": contact.email,
                    "linkedin_url": contact.linkedin_url,
                    "job_title": contact.job_title,
                    "company": contact.company,
                    "confidence": contact.confidence,
                }
        except Exception as e:
            logger.warning(f"Apollo error for {name}: {e}")
        
        return None
    
    def _try_hunter(
        self,
        name: str,
        domain: str,
        phone: Optional[str],
        company: Optional[str],
    ) -> Optional[Dict]:
        """Try Hunter email finder."""
        try:
            client = self.clients["hunter"]
            contact = client.find_email(
                name=name,
                domain=domain,
                phone=phone,
                company=company,
            )
            
            if contact.is_enriched:
                return {
                    "email": contact.email,
                    "linkedin_url": contact.linkedin_url,
                    "job_title": contact.job_title,
                    "company": contact.company,
                    "confidence": contact.confidence,
                }
        except Exception as e:
            logger.warning(f"Hunter error for {name}: {e}")
        
        return None
    
    def _verify_email(self, email: str) -> Dict:
        """Verify email with Hunter."""
        try:
            client = self.clients["hunter"]
            result = client.verify_email(email)
            
            return {
                "status": result.status.value,
                "score": result.score,
                "is_deliverable": result.is_deliverable,
                "is_disposable": result.is_disposable,
            }
        except Exception as e:
            logger.warning(f"Verification error for {email}: {e}")
            return {
                "status": "unknown",
                "is_deliverable": False,
            }
    
    def verify_email(self, email: str) -> EmailVerificationResult:
        """
        Verify a single email address.
        
        Args:
            email: Email address to verify
        
        Returns:
            EmailVerificationResult with deliverability info
        """
        if "hunter" not in self.clients:
            raise ValueError("Hunter client required for email verification")
        
        return self.clients["hunter"].verify_email(email)
    
    def get_available_providers(self) -> List[str]:
        """Get list of initialized providers."""
        return list(self.clients.keys())


def enrich_contacts_multi(
    contacts: List[Dict[str, str]],
    output_file: Optional[str] = None,
    enabled_providers: Optional[List[str]] = None,
    verify_emails: bool = True,
) -> List[EnrichmentResult]:
    """
    Enrich a list of contacts using multiple providers.
    
    Args:
        contacts: List of dicts with name, phone, company (optional), domain (optional)
        output_file: Optional CSV file to write results
        enabled_providers: List of providers to use
        verify_emails: Whether to verify found emails
    
    Returns:
        List of EnrichmentResult
    """
    enricher = MultiProviderEnricher(
        enabled_providers=enabled_providers,
        verify_emails=verify_emails,
    )
    
    results = []
    for i, contact in enumerate(contacts):
        logger.info(f"Processing {i+1}/{len(contacts)}: {contact.get('name')}")
        
        result = enricher.enrich_contact(
            name=contact.get("name", ""),
            phone=contact.get("phone", ""),
            company=contact.get("company"),
            domain=contact.get("domain"),
        )
        results.append(result)
    
    # Write to CSV if output file specified
    if output_file:
        import csv
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            if results:
                writer = csv.DictWriter(f, fieldnames=results[0].to_dict().keys())
                writer.writeheader()
                for result in results:
                    writer.writerow(result.to_dict())
        logger.info(f"Results written to {output_file}")
    
    return results


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    logging.basicConfig(level=logging.INFO)
    
    # Test multi-provider enrichment
    enricher = MultiProviderEnricher()
    print(f"Available providers: {enricher.get_available_providers()}")
    
    # Test with a sample contact
    result = enricher.enrich_contact(
        name="Test User",
        phone="+97412345678",
        company="Test Corp",
        domain="testcorp.com",
    )
    print(f"Result: {result.to_dict()}")
