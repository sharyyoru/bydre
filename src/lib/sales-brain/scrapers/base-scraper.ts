// Base Developer Scraper Framework
// Provides common functionality for scraping developer websites

import { ScraperResult, ScrapedProject } from "../types"

export interface ScraperConfig {
  name: string
  baseUrl: string
  rateLimit: number // requests per minute
  timeout: number // ms
  retries: number
  headers?: Record<string, string>
}

export abstract class BaseScraper {
  protected config: ScraperConfig
  protected lastRequestTime = 0

  constructor(config: ScraperConfig) {
    this.config = config
  }

  /**
   * Rate limiting - wait if necessary before making a request
   */
  protected async rateLimitWait(): Promise<void> {
    const minInterval = 60000 / this.config.rateLimit
    const elapsed = Date.now() - this.lastRequestTime
    if (elapsed < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - elapsed))
    }
    this.lastRequestTime = Date.now()
  }

  /**
   * Fetch with retry logic
   */
  protected async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        await this.rateLimitWait()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
        
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            ...this.config.headers,
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response
      } catch (err) {
        lastError = err as Error
        console.warn(`Scraper ${this.config.name} attempt ${attempt + 1} failed:`, lastError.message)
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError || new Error("All retry attempts failed")
  }

  /**
   * Parse HTML content - subclasses should override this
   */
  protected abstract parseHtml(html: string): ScrapedProject[]

  /**
   * Get the list of project URLs to scrape - subclasses should override this
   */
  protected abstract getProjectUrls(): Promise<string[]>

  /**
   * Main scrape method
   */
  async scrape(): Promise<ScraperResult> {
    const result: ScraperResult = {
      developer: this.config.name,
      projects: [],
      scraped_at: new Date().toISOString(),
      errors: [],
    }

    try {
      const urls = await this.getProjectUrls()
      console.log(`Scraper ${this.config.name}: Found ${urls.length} project URLs`)

      for (const url of urls) {
        try {
          const response = await this.fetchWithRetry(url)
          const html = await response.text()
          const projects = this.parseHtml(html)
          result.projects.push(...projects)
        } catch (err) {
          const message = `Failed to scrape ${url}: ${(err as Error).message}`
          result.errors.push(message)
          console.error(message)
        }
      }
    } catch (err) {
      const message = `Scraper ${this.config.name} failed: ${(err as Error).message}`
      result.errors.push(message)
      console.error(message)
    }

    console.log(`Scraper ${this.config.name}: Completed with ${result.projects.length} projects, ${result.errors.length} errors`)
    return result
  }
}

/**
 * Simple HTML text extraction helpers
 */
export function extractText(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match ? match[1].trim() : null
}

export function extractNumber(html: string, pattern: RegExp): number | null {
  const text = extractText(html, pattern)
  if (!text) return null
  const num = parseFloat(text.replace(/[,\s]/g, ""))
  return isNaN(num) ? null : num
}

export function extractAllMatches(html: string, pattern: RegExp): string[] {
  const matches: string[] = []
  let match
  const globalPattern = new RegExp(pattern.source, "g" + (pattern.flags.includes("i") ? "i" : ""))
  while ((match = globalPattern.exec(html)) !== null) {
    matches.push(match[1].trim())
  }
  return matches
}

/**
 * Clean HTML content
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Extract JSON-LD structured data
 */
export function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  
  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (Array.isArray(data)) {
        results.push(...data)
      } else {
        results.push(data)
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return results
}
