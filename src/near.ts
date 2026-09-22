/** Hamming distance for equal-length strings; Infinity if lengths differ. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY
  let distance = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance += 1
  }
  return distance
}

function isGtinLike(value: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(value)
}

/**
 * True when `value` looks like a GTIN and is only a few digit flips away from
 * an already-accepted code — typical blurry-camera misreads of the same barcode.
 */
export function isNearDuplicateGtin(
  value: string,
  seen: Iterable<string>,
  maxDistance = 3,
): boolean {
  if (!isGtinLike(value) || maxDistance < 1) return false
  for (const other of seen) {
    if (!isGtinLike(other)) continue
    if (hammingDistance(value, other) <= maxDistance) return true
  }
  return false
}
