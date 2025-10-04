/**
 * Utility functions for handling date ranges in reports
 */

export function parseDateRange(startDate: string | null, endDate: string | null) {
  const today = new Date()
  const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  let end: Date
  if (endDate) {
    // Check if endDate already includes time, if not add it
    if (endDate.includes('T')) {
      end = new Date(endDate)
    } else {
      end = new Date(endDate + 'T23:59:59.999Z')
    }
  } else {
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  }
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format provided')
  }
  
  return { start, end }
}

/**
 * Sanitizes a string to be safe for use in filenames
 * Removes or replaces characters that are not safe for filenames
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 50) // Limit length to 50 characters
}
