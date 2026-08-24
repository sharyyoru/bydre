"""
Result merger for combining enrichment data from multiple sources.
Handles deduplication, confidence scoring, and source tracking.
"""

import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


@dataclass
class SourceResult:
    """Result from a single source."""
    source: str  # 'pdl', 'google', 'linkedin', 'website'
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    confidence: float = 0.0
    error: Optional[str] = None
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MergedResult:
    """Merged result from all sources."""
    name: str
    phone: str
    original_phone: str
    
    # Best values with source tracking
    email: Optional[str] = None
    email_source: Optional[str] = None
    email_confidence: float = 0.0
    
    linkedin_url: Optional[str] = None
    linkedin_source: Optional[str] = None
    
    job_title: Optional[str] = None
    job_title_source: Optional[str] = None
    
    company: Optional[str] = None
    company_source: Optional[str] = None
    
    location: Optional[str] = None
    
    # Overall confidence (weighted average)
    overall_confidence: float = 0.0
    
    # All source results for debugging
    source_results: List[SourceResult] = field(default_factory=list)
    
    # Status
    status: str = "pending"
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for CSV export."""
        return {
            'Name': self.name,
            'Original_Phone': self.original_phone,
            'Phone': self.phone,
            'Email': self.email or '',
            'Email_Source': self.email_source or '',
            'Email_Confidence': f"{self.email_confidence:.2f}" if self.email else '',
            'LinkedIn_URL': self.linkedin_url or '',
            'LinkedIn_Source': self.linkedin_source or '',
            'Job_Title': self.job_title or '',
            'Job_Title_Source': self.job_title_source or '',
            'Company': self.company or '',
            'Company_Source': self.company_source or '',
            'Location': self.location or '',
            'Overall_Confidence': f"{self.overall_confidence:.2f}",
            'Status': self.status,
            'Error': self.error or '',
        }


# Source priority (higher = more trusted)
SOURCE_PRIORITY = {
    'pdl': 100,      # API data is most reliable
    'linkedin': 80,  # LinkedIn profile data is trustworthy
    'google': 50,    # Google results are less reliable
    'website': 60,   # Company website data is moderately reliable
}


class ResultMerger:
    """
    Merges enrichment results from multiple sources.
    
    Strategy:
    1. Prefer sources with higher confidence scores
    2. Use source priority for tie-breaking
    3. Track which source provided each field
    4. Aggregate all found data
    
    Usage:
        merger = ResultMerger()
        merged = merger.merge(
            name="John Smith",
            phone="+974501234567",
            original_phone="501234567",
            results=[pdl_result, google_result, linkedin_result]
        )
    """
    
    def __init__(self, source_priority: Optional[Dict[str, int]] = None):
        """
        Initialize merger with optional custom source priority.
        
        Args:
            source_priority: Dict of source -> priority (higher = more trusted)
        """
        self.source_priority = source_priority or SOURCE_PRIORITY.copy()
    
    def _score_result(self, result: SourceResult, field: str) -> float:
        """
        Calculate a score for a result's field value.
        
        Combines confidence with source priority.
        """
        value = getattr(result, field, None)
        if not value:
            return 0
        
        # Base score is confidence (0-1)
        score = result.confidence
        
        # Add source priority bonus (normalized to 0-0.5)
        priority = self.source_priority.get(result.source, 50)
        score += (priority / 200)  # Max 0.5 bonus
        
        return score
    
    def _select_best(
        self,
        results: List[SourceResult],
        field: str
    ) -> tuple[Optional[Any], Optional[str], float]:
        """
        Select the best value for a field from multiple results.
        
        Returns:
            Tuple of (value, source, confidence)
        """
        best_value = None
        best_source = None
        best_score = 0
        best_confidence = 0
        
        for result in results:
            value = getattr(result, field, None)
            if not value:
                continue
            
            score = self._score_result(result, field)
            
            if score > best_score:
                best_value = value
                best_source = result.source
                best_score = score
                best_confidence = result.confidence
        
        return best_value, best_source, best_confidence
    
    def _calculate_overall_confidence(self, merged: MergedResult) -> float:
        """Calculate overall confidence based on how much data was found."""
        confidence = 0.0
        
        # Email is most valuable
        if merged.email:
            confidence += 0.4 * merged.email_confidence
        
        # LinkedIn is valuable
        if merged.linkedin_url:
            confidence += 0.2
        
        # Job title and company add value
        if merged.job_title:
            confidence += 0.15
        if merged.company:
            confidence += 0.15
        
        # Location is minor
        if merged.location:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def merge(
        self,
        name: str,
        phone: str,
        original_phone: str,
        results: List[SourceResult]
    ) -> MergedResult:
        """
        Merge results from multiple sources.
        
        Args:
            name: Contact name
            phone: Normalized phone number
            original_phone: Original phone from CSV
            results: List of results from different sources
        
        Returns:
            MergedResult with best values from all sources
        """
        # Filter out results with errors
        valid_results = [r for r in results if not r.error]
        
        merged = MergedResult(
            name=name,
            phone=phone,
            original_phone=original_phone,
            source_results=results,
        )
        
        if not valid_results:
            # All sources failed
            errors = [r.error for r in results if r.error]
            merged.status = "failed"
            merged.error = "; ".join(filter(None, errors)) or "All sources failed"
            return merged
        
        # Select best value for each field
        merged.email, merged.email_source, merged.email_confidence = \
            self._select_best(valid_results, 'email')
        
        merged.linkedin_url, merged.linkedin_source, _ = \
            self._select_best(valid_results, 'linkedin_url')
        
        merged.job_title, merged.job_title_source, _ = \
            self._select_best(valid_results, 'job_title')
        
        merged.company, merged.company_source, _ = \
            self._select_best(valid_results, 'company')
        
        merged.location, _, _ = \
            self._select_best(valid_results, 'location')
        
        # Calculate overall confidence
        merged.overall_confidence = self._calculate_overall_confidence(merged)
        
        # Set status
        if merged.email or merged.linkedin_url:
            merged.status = "enriched"
        else:
            merged.status = "no_match"
        
        return merged
    
    def merge_batch(
        self,
        contacts: List[Dict[str, Any]],
        results_by_contact: Dict[str, List[SourceResult]]
    ) -> List[MergedResult]:
        """
        Merge results for multiple contacts.
        
        Args:
            contacts: List of contact dicts with name, phone, original_phone
            results_by_contact: Dict mapping phone -> list of source results
        
        Returns:
            List of MergedResult for each contact
        """
        merged_results = []
        
        for contact in contacts:
            phone = contact['phone']
            results = results_by_contact.get(phone, [])
            
            merged = self.merge(
                name=contact['name'],
                phone=phone,
                original_phone=contact.get('original_phone', phone),
                results=results
            )
            merged_results.append(merged)
        
        return merged_results


def create_source_result(
    source: str,
    data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None
) -> SourceResult:
    """
    Helper to create a SourceResult from a dict.
    
    Args:
        source: Source identifier
        data: Dict with email, linkedin_url, job_title, company, confidence
        error: Error message if source failed
    
    Returns:
        SourceResult instance
    """
    if error:
        return SourceResult(source=source, error=error)
    
    if not data:
        return SourceResult(source=source, error="No data")
    
    return SourceResult(
        source=source,
        email=data.get('email'),
        linkedin_url=data.get('linkedin_url'),
        job_title=data.get('job_title'),
        company=data.get('company'),
        location=data.get('location'),
        confidence=data.get('confidence', 0.5),
        raw_data=data,
    )


if __name__ == "__main__":
    # Test the merger
    logging.basicConfig(level=logging.DEBUG)
    
    merger = ResultMerger()
    
    # Simulate results from different sources
    pdl_result = SourceResult(
        source='pdl',
        email='john@company.com',
        job_title='CEO',
        company='Company Inc',
        confidence=0.9
    )
    
    google_result = SourceResult(
        source='google',
        email='john.smith@company.com',
        linkedin_url='https://linkedin.com/in/johnsmith',
        confidence=0.6
    )
    
    linkedin_result = SourceResult(
        source='linkedin',
        linkedin_url='https://linkedin.com/in/johnsmith',
        job_title='Chief Executive Officer',
        company='Company Inc.',
        confidence=0.85
    )
    
    merged = merger.merge(
        name='John Smith',
        phone='+974501234567',
        original_phone='501234567',
        results=[pdl_result, google_result, linkedin_result]
    )
    
    print("Merged Result:")
    print(f"  Email: {merged.email} (from {merged.email_source})")
    print(f"  LinkedIn: {merged.linkedin_url} (from {merged.linkedin_source})")
    print(f"  Job Title: {merged.job_title} (from {merged.job_title_source})")
    print(f"  Company: {merged.company} (from {merged.company_source})")
    print(f"  Overall Confidence: {merged.overall_confidence:.2f}")
    print(f"  Status: {merged.status}")
