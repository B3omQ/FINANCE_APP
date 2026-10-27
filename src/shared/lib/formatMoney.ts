/**
 * Formats a number into Vietnamese Dong currency string.
 * Example: 1500000 -> "1.500.000 ₫"
 * Handles negative amounts: -50000 -> "-50.000 ₫"
 */
export function formatMoney(amount: number, options?: { showSign?: boolean }): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  // Using vi-VN thousand dots separator
  const formattedNumber = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (rounded < 0) {
    return `-${formattedNumber} ₫`;
  }

  if (options?.showSign && rounded > 0) {
    return `+${formattedNumber} ₫`;
  }

  return `${formattedNumber} ₫`;
}
