/**
 * Validate SUN (Service User Number)
 * Rule: exactly 6 digits
 */
export function isValidSun(sun: string): boolean {
  return /^\d{6}$/.test(sun);
}

export default { isValidSun };
