// Emaar Developer Website Scraper
// Scrapes project availability from emaar.com

import { ScrapedProject } from "../types"
import { BaseScraper, extractText, stripHtml, extractJsonLd } from "./base-scraper"

export class EmaarScraper extends BaseScraper {
  constructor() {
    super({
      name: "Emaar",
      baseUrl: "https://www.emaar.com",
      rateLimit: 10, // 10 requests per minute
      timeout: 30000, // 30 seconds
      retries: 3,
    })
  }

  protected async getProjectUrls(): Promise<string[]> {
    // Fetch the main projects listing page
    try {
      const response = await this.fetchWithRetry(`${this.config.baseUrl}/en/properties`)
      const html = await response.text()
      
      // Extract project URLs from the listing page
      const urlPattern = /href=["'](\/en\/[^"']*(?:property|project)[^"']*)["']/gi
      const urls: string[] = []
      let match
      
      while ((match = urlPattern.exec(html)) !== null) {
        const fullUrl = `${this.config.baseUrl}${match[1]}`
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl)
        }
      }
      
      // Limit to avoid overwhelming the server
      return urls.slice(0, 50)
    } catch (err) {
      console.error("Failed to get Emaar project URLs:", err)
      return []
    }
  }

  protected parseHtml(html: string): ScrapedProject[] {
    const projects: ScrapedProject[] = []
    
    // Try to extract structured data first
    const jsonLd = extractJsonLd(html)
    for (const data of jsonLd) {
      if (data["@type"] === "Product" || data["@type"] === "RealEstateListing") {
        const project = this.parseJsonLdProduct(data)
        if (project) {
          projects.push(project)
        }
      }
    }
    
    // If no structured data, try HTML parsing
    if (projects.length === 0) {
      const project = this.parseHtmlContent(html)
      if (project) {
        projects.push(project)
      }
    }
    
    return projects
  }

  private parseJsonLdProduct(data: Record<string, unknown>): ScrapedProject | null {
    try {
      const name = data.name as string
      if (!name) return null

      const offers = data.offers as Record<string, unknown> | undefined
      let priceMin: number | undefined
      let priceMax: number | undefined

      if (offers) {
        if (offers.lowPrice) priceMin = Number(offers.lowPrice)
        if (offers.highPrice) priceMax = Number(offers.highPrice)
        if (offers.price) priceMin = priceMax = Number(offers.price)
      }

      return {
        name,
        external_id: data.sku as string || undefined,
        url: data.url as string || undefined,
        price_min: priceMin,
        price_max: priceMax,
        status: (data.availability as string)?.includes("InStock") ? "available" : undefined,
        raw_data: data,
      }
    } catch {
      return null
    }
  }

  private parseHtmlContent(html: string): ScrapedProject | null {
    try {
      // Extract project name
      const name = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/i) ||
                   extractText(html, /<title>([^<|]+)/i)
      
      if (!name) return null

      // Extract price
      const priceText = extractText(html, /(?:starting|from|price)[^<]*?AED[^<]*?([\d,]+)/i)
      const priceMin = priceText ? parseFloat(priceText.replace(/,/g, "")) : undefined

      // Extract bedrooms
      const bedroomsText = extractText(html, /(\d+)\s*(?:bedroom|br|bed)/i)
      
      // Extract location
      const location = extractText(html, /(?:location|area|district)[^<]*?<[^>]*>([^<]+)/i)

      // Extract status
      let status: string | undefined
      const htmlLower = html.toLowerCase()
      if (htmlLower.includes("sold out")) status = "sold_out"
      else if (htmlLower.includes("available") || htmlLower.includes("for sale")) status = "available"
      else if (htmlLower.includes("coming soon") || htmlLower.includes("launching")) status = "launch"

      return {
        name: stripHtml(name),
        price_min: priceMin,
        status,
        raw_data: {
          location,
          bedrooms: bedroomsText,
        },
      }
    } catch {
      return null
    }
  }
}

// Factory function
export function createEmaarScraper(): EmaarScraper {
  return new EmaarScraper()
}
