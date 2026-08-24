"""
Waterfall Email Enrichment System

Strategy:
1. Stage 1: Phone → Company/Social (CallerKit for GCC)
2. Stage 2: Name + Company → Email (Apollo → Hunter → Snov.io)
3. Stage 3: Verify email deliverability (Hunter)

This approach achieves 80%+ hit rates vs 50% from single providers.
"""

import os
import asyncio
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum
from dotenv import load_dotenv

load_dotenv()

# Import our clients
from callerkit_client import CallerKitClient, CallerKitContact
from apollo_client import ApolloClient
from hunter_client import HunterClient


class EnrichmentStage(Enum):
    PHONE_LOOKUP = "phone_lookup"      # CallerKit
    EMAIL_FINDER = "email_finder"       # Apollo, Hunter, Snov.io
    VERIFICATION = "verification"       # Hunter verify


@dataclass
class EnrichmentResult:
    """Complete enrichment result from waterfall"""
    # Input
    original_name: str
    original_phone: str
    
    # Stage 1: Phone lookup results
    enriched_name: Optional[str] = None
    company: Optional[str] = None
    domain: Optional[str] = None
    social_profiles: Optional[dict] = None
    
    # Stage 2: Email finder results
    email: Optional[str] = None
    email_source: Optional[str] = None  # Which provider found it
    
    # Stage 3: Verification
    is_verified: bool = False
    verification_status: Optional[str] = None
    is_deliverable: bool = False
    
    # Metadata
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    confidence: Optional[float] = None
    providers_tried: List[str] = field(default_factory=list)
    stage_completed: Optional[str] = None
    error: Optional[str] = None


class WaterfallEnricher:
    """
    Multi-stage waterfall enrichment system.
    
    Combines multiple data providers to maximize email find rates:
    - CallerKit: GCC phone → company/name (best for Middle East)
    - Apollo: Name + company → email
    - Hunter: Name + domain → email + verification
    - Snov.io: LinkedIn + company → email (future)
    
    Expected hit rates:
    - Single provider: 40-60%
    - Waterfall (3+ providers): 80-95%
    """
    
    def __init__(
        self,
        callerkit_key: Optional[str] = None,
        apollo_key: Optional[str] = None,
        hunter_key: Optional[str] = None,
        snov_key: Optional[str] = None
    ):
        # Initialize available clients
        self.callerkit = None
        self.apollo = None
        self.hunter = None
        
        callerkit_key = callerkit_key or os.getenv("CALLERKIT_API_KEY")
        apollo_key = apollo_key or os.getenv("APOLLO_API_KEY")
        hunter_key = hunter_key or os.getenv("HUNTER_API_KEY")
        
        if callerkit_key:
            try:
                self.callerkit = CallerKitClient(callerkit_key)
                print("✓ CallerKit initialized (GCC phone lookup)")
            except Exception as e:
                print(f"✗ CallerKit init failed: {e}")
        
        if apollo_key:
            try:
                self.apollo = ApolloClient(apollo_key)
                print("✓ Apollo initialized (email finder)")
            except Exception as e:
                print(f"✗ Apollo init failed: {e}")
        
        if hunter_key:
            try:
                self.hunter = HunterClient(hunter_key)
                print("✓ Hunter initialized (email finder + verification)")
            except Exception as e:
                print(f"✗ Hunter init failed: {e}")
        
        self._check_providers()
    
    def _check_providers(self):
        """Check which providers are available"""
        available = []
        if self.callerkit:
            available.append("CallerKit (GCC phones)")
        if self.apollo:
            available.append("Apollo (email finder)")
        if self.hunter:
            available.append("Hunter (email finder + verify)")
        
        if not available:
            print("⚠️  No providers configured! Set API keys in .env")
        else:
            print(f"\n📊 Waterfall providers: {' → '.join(available)}")
    
    async def enrich_contact(
        self,
        name: str,
        phone: str,
        company: Optional[str] = None,
        domain: Optional[str] = None
    ) -> EnrichmentResult:
        """
        Run full waterfall enrichment for a single contact.
        
        Args:
            name: Contact's full name
            phone: Phone number (Qatar/GCC format)
            company: Company name (if known)
            domain: Company domain (if known)
            
        Returns:
            EnrichmentResult with all available data
        """
        result = EnrichmentResult(
            original_name=name,
            original_phone=phone,
            company=company,
            domain=domain
        )
        
        # ============================================
        # STAGE 1: Phone Lookup (CallerKit for GCC)
        # ============================================
        if self.callerkit and not company:
            result.providers_tried.append("callerkit")
            try:
                ck_result = await self.callerkit.lookup_phone(phone)
                if ck_result:
                    result.enriched_name = ck_result.primary_name or name
                    result.company = ck_result.company
                    result.social_profiles = ck_result.social_profiles
                    
                    # If CallerKit found email, we're done!
                    if ck_result.email:
                        result.email = ck_result.email
                        result.email_source = "callerkit"
                        result.stage_completed = "phone_lookup"
                        
                        # Still verify if Hunter is available
                        if self.hunter:
                            verified = await self._verify_email(result.email)
                            result.is_verified = verified.get("is_verified", False)
                            result.verification_status = verified.get("status")
                            result.is_deliverable = verified.get("is_deliverable", False)
                        
                        return result
                    
                    # Extract LinkedIn if available
                    if result.social_profiles:
                        result.linkedin_url = result.social_profiles.get("linkedin")
                    
                    print(f"  CallerKit: Found company '{result.company}'")
            except Exception as e:
                print(f"  CallerKit error: {e}")
        
        # Use provided or discovered company
        company_name = result.company or company
        company_domain = result.domain or domain
        
        # Try to derive domain from company name
        if company_name and not company_domain:
            company_domain = self._guess_domain(company_name)
        
        # ============================================
        # STAGE 2: Email Finding (Waterfall)
        # ============================================
        
        # Need company/domain for email finding
        if not company_name and not company_domain:
            result.error = "No company/domain - cannot find email"
            result.stage_completed = "phone_lookup"
            return result
        
        # Try Apollo first (best coverage)
        if self.apollo and not result.email:
            result.providers_tried.append("apollo")
            try:
                apollo_result = await self.apollo.search_person(
                    name=name,
                    company=company_name,
                    domain=company_domain
                )
                if apollo_result and apollo_result.email:
                    result.email = apollo_result.email
                    result.email_source = "apollo"
                    result.job_title = apollo_result.title
                    result.linkedin_url = apollo_result.linkedin_url
                    result.confidence = apollo_result.confidence
                    print(f"  Apollo: Found email '{result.email}'")
            except Exception as e:
                print(f"  Apollo error: {e}")
        
        # Try Hunter if Apollo failed
        if self.hunter and not result.email:
            result.providers_tried.append("hunter")
            try:
                hunter_result = await self.hunter.find_and_verify(
                    first_name=name.split()[0] if name else "",
                    last_name=" ".join(name.split()[1:]) if name and len(name.split()) > 1 else "",
                    domain=company_domain,
                    company=company_name
                )
                if hunter_result and hunter_result.get("email"):
                    result.email = hunter_result["email"]
                    result.email_source = "hunter"
                    result.is_verified = hunter_result.get("is_verified", False)
                    result.verification_status = hunter_result.get("verification_status")
                    result.is_deliverable = hunter_result.get("is_deliverable", False)
                    result.confidence = hunter_result.get("confidence")
                    print(f"  Hunter: Found email '{result.email}'")
            except Exception as e:
                print(f"  Hunter error: {e}")
        
        # ============================================
        # STAGE 3: Verification (if not already done)
        # ============================================
        if result.email and not result.is_verified and self.hunter:
            result.providers_tried.append("hunter_verify")
            verified = await self._verify_email(result.email)
            result.is_verified = verified.get("is_verified", False)
            result.verification_status = verified.get("status")
            result.is_deliverable = verified.get("is_deliverable", False)
        
        result.stage_completed = "complete" if result.email else "no_email_found"
        return result
    
    async def _verify_email(self, email: str) -> dict:
        """Verify email deliverability via Hunter"""
        if not self.hunter:
            return {}
        
        try:
            verification = await self.hunter.verify_email(email)
            if verification:
                return {
                    "is_verified": True,
                    "status": verification.status,
                    "is_deliverable": verification.status == "valid"
                }
        except Exception as e:
            print(f"  Verification error: {e}")
        
        return {}
    
    def _guess_domain(self, company_name: str) -> Optional[str]:
        """
        Attempt to guess domain from company name.
        
        Examples:
        - "Qatar Airways" → qatarairways.com
        - "Hamad Medical Corporation" → hamad.qa
        """
        if not company_name:
            return None
        
        # Known GCC company domains
        known_domains = {
            "qatar airways": "qatarairways.com",
            "qatar petroleum": "qp.com.qa",
            "qatargas": "qatargas.com",
            "ooredoo": "ooredoo.qa",
            "vodafone qatar": "vodafone.qa",
            "hamad medical": "hamad.qa",
            "sidra medicine": "sidra.org",
            "qatar foundation": "qf.org.qa",
            "qatar national bank": "qnb.com",
            "qnb": "qnb.com",
            "commercial bank": "cbq.qa",
            "doha bank": "dohabank.qa",
            "qatar insurance": "qic.com.qa",
            "ashghal": "ashghal.gov.qa",
            "kahramaa": "km.qa",
        }
        
        company_lower = company_name.lower().strip()
        
        # Check known domains
        for key, domain in known_domains.items():
            if key in company_lower:
                return domain
        
        # Simple heuristic: remove spaces, add .com
        simple = company_lower.replace(" ", "").replace(".", "")
        return f"{simple}.com"
    
    async def enrich_batch(
        self,
        contacts: List[Dict[str, Any]],
        rate_limit_ms: int = 500
    ) -> List[EnrichmentResult]:
        """
        Enrich a batch of contacts with rate limiting.
        
        Args:
            contacts: List of dicts with 'name', 'phone', optional 'company', 'domain'
            rate_limit_ms: Milliseconds between requests
            
        Returns:
            List of EnrichmentResult
        """
        results = []
        total = len(contacts)
        
        for i, contact in enumerate(contacts):
            print(f"\n[{i+1}/{total}] Processing: {contact.get('name', 'Unknown')}")
            
            result = await self.enrich_contact(
                name=contact.get("name", ""),
                phone=contact.get("phone", ""),
                company=contact.get("company"),
                domain=contact.get("domain")
            )
            results.append(result)
            
            # Rate limiting
            if i < total - 1:
                await asyncio.sleep(rate_limit_ms / 1000)
        
        return results
    
    def print_stats(self, results: List[EnrichmentResult]):
        """Print enrichment statistics"""
        total = len(results)
        emails_found = sum(1 for r in results if r.email)
        verified = sum(1 for r in results if r.is_verified)
        deliverable = sum(1 for r in results if r.is_deliverable)
        
        # By source
        by_source = {}
        for r in results:
            if r.email_source:
                by_source[r.email_source] = by_source.get(r.email_source, 0) + 1
        
        print("\n" + "=" * 50)
        print("📊 ENRICHMENT RESULTS")
        print("=" * 50)
        print(f"Total contacts:     {total}")
        print(f"Emails found:       {emails_found} ({emails_found/total*100:.1f}%)")
        print(f"Verified:           {verified}")
        print(f"Deliverable:        {deliverable}")
        print("\nBy Source:")
        for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
            print(f"  {source}: {count}")
        print("=" * 50)
    
    async def close(self):
        """Close all client connections"""
        if self.callerkit:
            await self.callerkit.close()
        if self.apollo:
            await self.apollo.close()
        if self.hunter:
            await self.hunter.close()


# CLI for testing
async def main():
    enricher = WaterfallEnricher()
    
    # Test contacts
    test_contacts = [
        {"name": "Captain Antonio Rama Toscano", "phone": "+97433453304"},
        {"name": "Dr. Ahmad Latif", "phone": "+97466180385"},
        {"name": "Dr. Ahmed Mohammed", "phone": "+97466715447"},
    ]
    
    results = await enricher.enrich_batch(test_contacts)
    enricher.print_stats(results)
    
    # Print details
    for r in results:
        print(f"\n{r.original_name}:")
        print(f"  Company: {r.company}")
        print(f"  Email: {r.email} (source: {r.email_source})")
        print(f"  Verified: {r.is_verified}, Deliverable: {r.is_deliverable}")
        print(f"  Providers tried: {', '.join(r.providers_tried)}")
    
    await enricher.close()


if __name__ == "__main__":
    asyncio.run(main())
