/**
 * Generates a unique email address for testing purposes
 * @returns A unique email address with a 6-digit random prefix
 */
export function generateUniqueEmail(): string {
  const randomDigits = Math.floor(Math.random() * 900000) + 100000; // 6-digit number between 100000-999999
  return `${randomDigits}@simulator.amazonses.com`;
}

/**
 * Generates a unique email address with a specific prefix for testing purposes
 * @param prefix - Optional prefix to add before the random digits
 * @returns A unique email address with the specified prefix and 6-digit random suffix
 */
export function generateUniqueEmailWithPrefix(prefix: string = ''): string {
  const randomDigits = Math.floor(Math.random() * 900000) + 100000; // 6-digit number between 100000-999999
  const emailPrefix = prefix ? `${prefix}${randomDigits}` : `${randomDigits}`;
  return `${emailPrefix}@simulator.amazonses.com`;
}
