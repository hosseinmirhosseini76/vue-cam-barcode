import { describe, expect, it } from 'vitest'
import { expandUpcE, isValidGtin, parseBarcode } from '../src/parse'

describe('isValidGtin', () => {
  it('accepts a valid EAN-13', () => {
    expect(isValidGtin('5901234123457')).toBe(true)
  })

  it('rejects a bad checksum', () => {
    expect(isValidGtin('5901234123450')).toBe(false)
  })
})

describe('parseBarcode', () => {
  it('parses EAN-13 product data including Iran prefix', () => {
    const parsed = parseBarcode('6261234567890', 'ean_13')
    expect(parsed.kind).toBe('gtin')
    expect(parsed.country).toBe('IR')
    expect(parsed.gs1Prefix).toBe('626')
  })

  it('parses UPC-A as GTIN-13', () => {
    const parsed = parseBarcode('036000291452', 'upc_a')
    expect(parsed.kind).toBe('gtin')
    expect(parsed.gtin).toBe('0036000291452')
    expect(parsed.checksumValid).toBe(true)
  })

  it('parses EAN-8', () => {
    const parsed = parseBarcode('96385074', 'ean_8')
    expect(parsed.kind).toBe('gtin')
    expect(parsed.checksumValid).toBe(true)
  })

  it('extracts GTIN from a GS1 QR payload', () => {
    const parsed = parseBarcode('(01)00614141999996(17)250101', 'qr_code')
    expect(parsed.kind).toBe('qr')
    expect(parsed.gtin).toBe('00614141999996')
    expect(parsed.gs1?.['17']).toBe('250101')
  })

  it('keeps Code128 text as code data', () => {
    const parsed = parseBarcode('SKU-DZP-0001', 'code_128')
    expect(parsed.kind).toBe('code')
    expect(parsed.value).toBe('SKU-DZP-0001')
  })
})

describe('expandUpcE', () => {
  it('expands a UPC-E to UPC-A', () => {
    expect(expandUpcE('04252614')).toBe('042100005264')
  })
})
