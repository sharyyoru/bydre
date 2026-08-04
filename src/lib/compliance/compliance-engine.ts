import {
  ComplianceStatus,
  ComplianceResult,
  ComplianceQRCode,
  PostAnalysis,
} from "./types"
import { hasCompanyQR, hasCorrectProjectQR } from "./qr-detector"

/**
 * Compliance evaluation engine.
 * Determines if a post meets QR code requirements based on analysis results.
 */

/**
 * Evaluate compliance for a single post
 */
export function evaluateCompliance(
  analysis: PostAnalysis,
  registeredQRCodes: ComplianceQRCode[]
): ComplianceResult {
  const violations: string[] = []
  
  // If not real estate content, mark as not applicable
  if (!analysis.classification.is_real_estate) {
    return {
      status: "not_applicable",
      company_qr_found: false,
      project_qr_found: false,
      project_qr_correct: false,
      violations: [],
    }
  }
  
  // Get company QR code
  const companyQR = registeredQRCodes.find(
    qr => qr.type === "company" && qr.is_active
  ) || null
  
  // Get project QR code (if project was identified)
  let projectQR: ComplianceQRCode | null = null
  if (analysis.project?.project_id) {
    projectQR = registeredQRCodes.find(
      qr => qr.type === "project" && 
           qr.project_id === analysis.project?.project_id &&
           qr.is_active
    ) || null
  }
  
  // Check for company QR
  const companyQRFound = hasCompanyQR(
    analysis.qr_detection.qr_codes,
    companyQR
  )
  
  if (!companyQRFound) {
    violations.push("Missing company QR code")
  }
  
  // Check for project QR
  const projectCheck = hasCorrectProjectQR(
    analysis.qr_detection.qr_codes,
    projectQR
  )
  
  if (analysis.project?.project_id && projectQR) {
    if (!projectCheck.found) {
      violations.push(`Missing project QR code for "${analysis.project.project_name}"`)
    } else if (!projectCheck.correct) {
      violations.push(`Wrong project QR code used (expected "${analysis.project.project_name}")`)
    }
  }
  
  // Determine overall status
  let status: ComplianceStatus = "compliant"
  
  if (!companyQRFound) {
    status = "missing_company_qr"
  } else if (analysis.project?.project_id && !projectCheck.found) {
    status = "missing_project_qr"
  } else if (analysis.project?.project_id && !projectCheck.correct) {
    status = "wrong_project_qr"
  }
  
  return {
    status,
    company_qr_found: companyQRFound,
    project_qr_found: projectCheck.found,
    project_qr_correct: projectCheck.correct,
    expected_project_qr: projectQR || undefined,
    found_project_qr: projectCheck.foundQR,
    violations,
  }
}

/**
 * Get compliance status display info
 */
export function getComplianceStatusInfo(status: ComplianceStatus): {
  label: string
  color: string
  icon: string
  description: string
} {
  switch (status) {
    case "compliant":
      return {
        label: "Compliant",
        color: "green",
        icon: "check-circle",
        description: "All required QR codes are present and correct",
      }
    case "missing_company_qr":
      return {
        label: "Missing Company QR",
        color: "red",
        icon: "alert-circle",
        description: "The company QR code is not visible in this post",
      }
    case "missing_project_qr":
      return {
        label: "Missing Project QR",
        color: "red",
        icon: "alert-circle",
        description: "The project-specific QR code is not visible in this post",
      }
    case "wrong_project_qr":
      return {
        label: "Wrong Project QR",
        color: "orange",
        icon: "alert-triangle",
        description: "A project QR code was found but it doesn't match the promoted project",
      }
    case "pending":
      return {
        label: "Pending Review",
        color: "yellow",
        icon: "clock",
        description: "This post is waiting to be analyzed",
      }
    case "not_applicable":
      return {
        label: "Not Applicable",
        color: "gray",
        icon: "minus-circle",
        description: "This post is not about real estate and doesn't require QR codes",
      }
    default:
      return {
        label: "Unknown",
        color: "gray",
        icon: "help-circle",
        description: "Status unknown",
      }
  }
}

/**
 * Calculate compliance rate
 */
export function calculateComplianceRate(
  checks: { compliance_status: ComplianceStatus }[]
): number {
  const applicable = checks.filter(
    c => c.compliance_status !== "not_applicable" && c.compliance_status !== "pending"
  )
  
  if (applicable.length === 0) return 100
  
  const compliant = applicable.filter(c => c.compliance_status === "compliant")
  return Math.round((compliant.length / applicable.length) * 100)
}

/**
 * Group violations by type
 */
export function groupViolationsByType(
  checks: { compliance_status: ComplianceStatus }[]
): Record<ComplianceStatus, number> {
  const counts: Record<ComplianceStatus, number> = {
    pending: 0,
    compliant: 0,
    missing_company_qr: 0,
    missing_project_qr: 0,
    wrong_project_qr: 0,
    not_applicable: 0,
  }
  
  for (const check of checks) {
    counts[check.compliance_status]++
  }
  
  return counts
}

/**
 * Get severity level for a compliance status
 */
export function getViolationSeverity(status: ComplianceStatus): "critical" | "warning" | "info" | "none" {
  switch (status) {
    case "missing_company_qr":
      return "critical"
    case "missing_project_qr":
      return "critical"
    case "wrong_project_qr":
      return "warning"
    case "pending":
      return "info"
    default:
      return "none"
  }
}

/**
 * Check if QR codes contain expected content patterns
 */
export function validateQRCodeContent(
  qrData: string,
  expectedPatterns: { company?: string; project?: string }
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check if QR data is a valid URL
  try {
    new URL(qrData)
  } catch {
    issues.push("QR code does not contain a valid URL")
  }
  
  // Check for company pattern
  if (expectedPatterns.company && !qrData.includes(expectedPatterns.company)) {
    issues.push(`QR code does not contain company identifier: ${expectedPatterns.company}`)
  }
  
  // Check for project pattern
  if (expectedPatterns.project && !qrData.includes(expectedPatterns.project)) {
    issues.push(`QR code does not contain project identifier: ${expectedPatterns.project}`)
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Suggest corrections for non-compliant posts
 */
export function suggestCorrections(
  result: ComplianceResult,
  detectedProjectName?: string
): string[] {
  const suggestions: string[] = []
  
  if (!result.company_qr_found) {
    suggestions.push("Add the company QR code to a visible area of your post image(s)")
  }
  
  if (!result.project_qr_found && result.expected_project_qr) {
    suggestions.push(
      `Add the QR code for "${result.expected_project_qr.name}" to your post`
    )
  }
  
  if (result.project_qr_found && !result.project_qr_correct) {
    suggestions.push(
      `Replace the current project QR code with the correct one for "${detectedProjectName || "this project"}"`
    )
  }
  
  return suggestions
}
