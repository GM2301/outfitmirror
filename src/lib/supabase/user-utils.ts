/**
 * Utility functions for handling user IDs
 * Supabase Auth uses UUID, but some schemas use int8 (bigint)
 */

/**
 * Convert a UUID string to a deterministic bigint string
 * This creates a hash-based conversion for schemas that use int8
 * Returns as string to avoid precision issues with JavaScript numbers
 */
export function uuidToBigInt(uuid: string): string {
  // Remove dashes and convert to a number
  // This creates a deterministic bigint from UUID
  const hex = uuid.replace(/-/g, '')
  // Take first 16 characters (64 bits) and convert to bigint
  const firstPart = hex.substring(0, 16)
  const bigIntValue = BigInt('0x' + firstPart)
  // Return as string to avoid JavaScript number precision issues
  return bigIntValue.toString()
}

/**
 * Get user ID in the format needed for the database
 * If schema uses int8, converts UUID to bigint string
 * If schema uses uuid, returns UUID as-is
 */
export function getUserIdForDb(authUserId: string, useBigInt: boolean = false): string {
  if (useBigInt) {
    return uuidToBigInt(authUserId)
  }
  return authUserId
}
