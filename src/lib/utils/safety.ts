// Safety constants and patterns
const SAFETY_CONFIG = {
  phonePatterns: [
    /\+91[\s-]?\d{10}/, // Indian format: +91 9876543210
    /\+1[\s-]?\d{10}/, // US format: +1 9876543210
    /^\d{10}$/, // Plain 10 digits
    /^\d{3}[\s-]?\d{3}[\s-]?\d{4}$/, // XXX-XXX-XXXX format
    /\d{5}[\s-]?\d{5}/, // 5+5 format
  ],
  contactKeywords: [
    'whatsapp',
    'gpay',
    'paytm',
    'phone',
    'call me',
    'text me',
    'email me',
    'send message',
    'dm me',
    'direct message',
  ],
  replacementMessage: '[Safety Alert: Personal contact hidden until hire]',
}

// Check and filter a message for safety
export function filterMessage(content: string): {
  filtered: boolean
  result: string
  warnings: string[]
} {
  let result = content
  let filtered = false
  const warnings: string[] = []

  // Check for phone numbers
  for (const pattern of SAFETY_CONFIG.phonePatterns) {
    if (pattern.test(result)) {
      result = result.replace(pattern, SAFETY_CONFIG.replacementMessage)
      filtered = true
      warnings.push('Phone number detected')
    }
  }

  // Check for contact keywords
  const lowerContent = result.toLowerCase()
  for (const keyword of SAFETY_CONFIG.contactKeywords) {
    if (lowerContent.includes(keyword)) {
      // Only replace the keyword, not the whole message
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      result = result.replace(regex, SAFETY_CONFIG.replacementMessage)
      filtered = true
      warnings.push(`Contact keyword: ${keyword}`)
    }
  }

  return {
    filtered,
    result,
    warnings,
  }
}

// Check if a message should be blocked entirely
export function shouldBlockMessage(content: string): boolean {
  const phoneMatches = SAFETY_CONFIG.phonePatterns.filter((pattern) =>
    pattern.test(content)
  ).length
  const keywordMatches = SAFETY_CONFIG.contactKeywords.filter((keyword) =>
    content.toLowerCase().includes(keyword)
  ).length

  // Block if multiple phone numbers or keywords found
  return phoneMatches > 1 || keywordMatches > 2
}

// Generate safety warning toast message
export function getSafetyWarningMessage(): string {
  return 'Keep payments on TalentFlow to stay insured.'
}

// Validate file type for uploads
export function isAllowedFileType(
  fileType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf']
): boolean {
  return allowedTypes.includes(fileType)
}

// Validate file size (max 10MB)
export function isValidFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  return fileSize <= maxSizeMB * 1024 * 1024
}
