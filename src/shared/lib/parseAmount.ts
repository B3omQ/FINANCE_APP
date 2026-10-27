/**
 * Parses user input into a positive integer VND amount.
 *
 * Supported formats:
 * - Shorthand 'k': 50k -> 50,000; 100k -> 100,000; 1.5k -> 1,500
 * - Shorthand 'tr' / 'm': 1tr -> 1,000,000; 1tr2 -> 1,200,000; 2tr5 -> 2,500,000; 1.5tr -> 1,500,000
 * - Shorthand 'tỷ' / 'ty' / 'b': 1ty -> 1,000,000,000; 1ty5 -> 1,500,000,000
 * - Delimited numbers: 1.500.000, 1,500,000, 1500000
 *
 * Returns null if input is invalid, zero, or negative.
 */
export function parseAmount(input: string | null | undefined): number | null {
  if (!input) return null;

  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Negative signs are invalid for amount input
  if (raw.startsWith("-") || raw.includes("neg")) {
    return null;
  }

  // Case 1: Shorthand with "ty" / "tỷ" / "b" (Billion)
  // e.g. 1ty, 1ty5, 1.5ty
  const billionMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*(?:t[ỷy]|b)(?:(\d+))?$/);
  if (billionMatch) {
    const mainStr = billionMatch[1]?.replace(",", ".") ?? "0";
    const main = parseFloat(mainStr);
    const subStr = billionMatch[2];
    if (isNaN(main) || main <= 0) return null;

    let sub = 0;
    if (subStr) {
      // 1ty5 => 1,500,000,000 (subStr '5' = 500,000,000)
      const subVal = parseFloat(subStr);
      sub = (subVal / Math.pow(10, subStr.length)) * 1_000_000_000;
    }
    const total = Math.round(main * 1_000_000_000 + sub);
    return total > 0 ? total : null;
  }

  // Case 2: Shorthand with "tr" / "m" (Million)
  // e.g. 1tr, 1tr2, 2tr5, 1.5tr, 1,5tr
  const millionMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*(?:tr|m)(?:(\d+))?$/);
  if (millionMatch) {
    const mainStr = millionMatch[1]?.replace(",", ".") ?? "0";
    const main = parseFloat(mainStr);
    const subStr = millionMatch[2];
    if (isNaN(main) || main <= 0) return null;

    let sub = 0;
    if (subStr) {
      // 1tr2 => 1,200,000 (subStr '2' = 200,000)
      const subVal = parseFloat(subStr);
      sub = (subVal / Math.pow(10, subStr.length)) * 1_000_000;
    }
    const total = Math.round(main * 1_000_000 + sub);
    return total > 0 ? total : null;
  }

  // Case 3: Shorthand with "k" (Thousand)
  // e.g. 50k, 100k, 1.5k, 2k5
  const thousandMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*k(?:(\d+))?$/);
  if (thousandMatch) {
    const mainStr = thousandMatch[1]?.replace(",", ".") ?? "0";
    const main = parseFloat(mainStr);
    const subStr = thousandMatch[2];
    if (isNaN(main) || main <= 0) return null;

    let sub = 0;
    if (subStr) {
      const subVal = parseFloat(subStr);
      sub = (subVal / Math.pow(10, subStr.length)) * 1_000;
    }
    const total = Math.round(main * 1_000 + sub);
    return total > 0 ? total : null;
  }

  // Case 4: Standard numbers with thousand separators (dots or commas or spaces)
  // E.g. 1.500.000, 1,500,000, 1500000
  // Clean all dots, commas, spaces
  const cleaned = raw.replace(/[.,\s]/g, "");
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }

  return null;
}
