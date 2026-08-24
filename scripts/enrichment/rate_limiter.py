"""
Rate limiter for multi-source scraping.
Implements per-source rate limiting to avoid bans.
"""

import time
import threading
import logging
from typing import Dict, Optional
from dataclasses import dataclass, field
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for a rate limiter."""
    requests_per_second: float  # Can be fractional (e.g., 0.1 = 1 per 10 seconds)
    burst_limit: int = 1  # Maximum burst requests allowed
    
    @property
    def min_interval(self) -> float:
        """Minimum interval between requests in seconds."""
        return 1.0 / self.requests_per_second if self.requests_per_second > 0 else 0


# Default rate limits per source
DEFAULT_RATE_LIMITS: Dict[str, RateLimitConfig] = {
    'pdl': RateLimitConfig(requests_per_second=8.0, burst_limit=10),  # 8/sec
    'google': RateLimitConfig(requests_per_second=0.17, burst_limit=2),  # ~10/min
    'linkedin': RateLimitConfig(requests_per_second=0.033, burst_limit=1),  # ~2/min
    'website': RateLimitConfig(requests_per_second=0.5, burst_limit=3),  # 30/min
}


@dataclass
class RateLimiterState:
    """State for a single rate limiter."""
    last_request_time: float = 0.0
    request_count: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock)


class RateLimiter:
    """
    Thread-safe rate limiter for multiple sources.
    
    Usage:
        limiter = RateLimiter()
        
        # Will block if rate limit exceeded
        limiter.wait('linkedin')
        make_linkedin_request()
        
        # Or check if request is allowed
        if limiter.can_request('google'):
            make_google_request()
            limiter.record_request('google')
    """
    
    def __init__(self, config: Optional[Dict[str, RateLimitConfig]] = None):
        """
        Initialize rate limiter with optional custom configuration.
        
        Args:
            config: Optional dict of source -> RateLimitConfig
        """
        self.config = config or DEFAULT_RATE_LIMITS.copy()
        self._state: Dict[str, RateLimiterState] = defaultdict(RateLimiterState)
        self._global_lock = threading.Lock()
    
    def get_config(self, source: str) -> RateLimitConfig:
        """Get rate limit config for a source, with fallback to default."""
        return self.config.get(source, RateLimitConfig(requests_per_second=1.0))
    
    def _get_state(self, source: str) -> RateLimiterState:
        """Get or create state for a source."""
        with self._global_lock:
            if source not in self._state:
                self._state[source] = RateLimiterState()
            return self._state[source]
    
    def time_until_allowed(self, source: str) -> float:
        """
        Get time in seconds until next request is allowed.
        
        Args:
            source: Source identifier (e.g., 'linkedin', 'google')
        
        Returns:
            Seconds to wait (0 if request allowed immediately)
        """
        config = self.get_config(source)
        state = self._get_state(source)
        
        with state.lock:
            now = time.time()
            elapsed = now - state.last_request_time
            wait_time = config.min_interval - elapsed
            
            return max(0, wait_time)
    
    def can_request(self, source: str) -> bool:
        """
        Check if a request can be made immediately.
        
        Args:
            source: Source identifier
        
        Returns:
            True if request is allowed
        """
        return self.time_until_allowed(source) <= 0
    
    def record_request(self, source: str):
        """
        Record that a request was made.
        
        Args:
            source: Source identifier
        """
        state = self._get_state(source)
        
        with state.lock:
            state.last_request_time = time.time()
            state.request_count += 1
    
    def wait(self, source: str) -> float:
        """
        Wait until a request is allowed, then record it.
        
        Args:
            source: Source identifier
        
        Returns:
            Actual time waited in seconds
        """
        wait_time = self.time_until_allowed(source)
        
        if wait_time > 0:
            logger.debug(f"Rate limiting {source}: waiting {wait_time:.2f}s")
            time.sleep(wait_time)
        
        self.record_request(source)
        return wait_time
    
    def get_stats(self, source: str) -> Dict:
        """
        Get statistics for a source.
        
        Args:
            source: Source identifier
        
        Returns:
            Dict with request count and other stats
        """
        config = self.get_config(source)
        state = self._get_state(source)
        
        with state.lock:
            return {
                'source': source,
                'total_requests': state.request_count,
                'rate_limit': f"{config.requests_per_second}/sec",
                'min_interval': f"{config.min_interval:.2f}s",
                'time_until_allowed': f"{self.time_until_allowed(source):.2f}s",
            }
    
    def reset(self, source: Optional[str] = None):
        """
        Reset rate limiter state.
        
        Args:
            source: Specific source to reset, or None to reset all
        """
        with self._global_lock:
            if source:
                if source in self._state:
                    self._state[source] = RateLimiterState()
            else:
                self._state.clear()


class DailyLimiter:
    """
    Tracks daily request counts per source.
    
    Usage:
        daily = DailyLimiter({'linkedin': 100, 'google': 1000})
        
        if daily.can_request('linkedin'):
            make_request()
            daily.record_request('linkedin')
    """
    
    def __init__(self, daily_limits: Dict[str, int]):
        """
        Initialize with daily limits per source.
        
        Args:
            daily_limits: Dict of source -> max requests per day
        """
        self.limits = daily_limits
        self._counts: Dict[str, int] = defaultdict(int)
        self._reset_date: Optional[str] = None
        self._lock = threading.Lock()
    
    def _check_reset(self):
        """Reset counts if it's a new day."""
        today = time.strftime('%Y-%m-%d')
        if self._reset_date != today:
            self._counts.clear()
            self._reset_date = today
            logger.info("Daily limits reset")
    
    def can_request(self, source: str) -> bool:
        """Check if daily limit allows another request."""
        with self._lock:
            self._check_reset()
            limit = self.limits.get(source, float('inf'))
            return self._counts[source] < limit
    
    def record_request(self, source: str):
        """Record a request."""
        with self._lock:
            self._check_reset()
            self._counts[source] += 1
    
    def remaining(self, source: str) -> int:
        """Get remaining requests for today."""
        with self._lock:
            self._check_reset()
            limit = self.limits.get(source, float('inf'))
            return max(0, limit - self._counts[source])
    
    def get_stats(self) -> Dict[str, Dict]:
        """Get all daily stats."""
        with self._lock:
            self._check_reset()
            return {
                source: {
                    'used': self._counts[source],
                    'limit': self.limits.get(source, 'unlimited'),
                    'remaining': self.remaining(source),
                }
                for source in set(list(self.limits.keys()) + list(self._counts.keys()))
            }


if __name__ == "__main__":
    # Test the rate limiter
    logging.basicConfig(level=logging.DEBUG)
    
    limiter = RateLimiter()
    
    print("Testing rate limiter...")
    
    # Test Google rate limit (should wait ~6 seconds between requests)
    for i in range(3):
        wait = limiter.wait('google')
        print(f"Google request {i+1}: waited {wait:.2f}s")
    
    print("\nStats:")
    print(limiter.get_stats('google'))
    print(limiter.get_stats('linkedin'))
    
    # Test daily limiter
    daily = DailyLimiter({'linkedin': 100, 'google': 1000})
    print(f"\nLinkedIn remaining: {daily.remaining('linkedin')}")
