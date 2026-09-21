import type { BarcodeFormat, ParsedBarcode } from './types'

/** Compact GS1 prefix → ISO country. Unknown prefixes stay undefined. */
const GS1_COUNTRY: Record<string, string> = {
  '00': 'US',
  '01': 'US',
  '30': 'FR',
  '31': 'FR',
  '40': 'DE',
  '45': 'JP',
  '49': 'JP',
  '50': 'GB',
  '57': 'DK',
  '64': 'FI',
  '69': 'CN',
  '70': 'NO',
  '73': 'SE',
  '76': 'CH',
  '80': 'IT',
  '84': 'ES',
  '87': 'NL',
  '90': 'AT',
  '93': 'AU',
  '94': 'NZ',
  '471': 'TW',
  '480': 'PH',
  '489': 'HK',
  '520': 'GR',
  '529': 'CY',
  '539': 'IE',
  '560': 'PT',
  '590': 'PL',
  '594': 'RO',
  '599': 'HU',
  '600': 'ZA',
  '616': 'KE',
  '618': 'CI',
  '619': 'TN',
  '620': 'SA',
  '622': 'EG',
  '625': 'JO',
  '626': 'IR',
  '627': 'KW',
  '628': 'SA',
  '629': 'AE',
  '690': 'CN',
  '729': 'IL',
  '750': 'MX',
  '759': 'VE',
  '770': 'CO',
  '773': 'UY',
  '775': 'PE',
  '777': 'BO',
  '779': 'AR',
  '780': 'CL',
  '784': 'PY',
  '786': 'EC',
  '789': 'BR',
  '850': 'CU',
  '858': 'SK',
  '859': 'CZ',
  '860': 'RS',
  '868': 'TR',
  '869': 'TR',
  '880': 'KR',
  '885': 'TH',
  '888': 'SG',
  '890': 'IN',
  '893': 'VN',
  '896': 'PK',
  '899': 'ID',
  '955': 'MY',
}

export function isValidGtin(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop() as number
  const sum = digits
    .reverse()
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

export function expandUpcE(upcE: string): string | undefined {
  const d = upcE.replace(/\D/g, '')
  if (d.length !== 8 && d.length !== 6) return undefined
  const body = d.length === 8 ? d.slice(1, 7) : d
  const ns = d.length === 8 ? d[0] : '0'
  const check = d.length === 8 ? d[7] : ''
  const last = body[5]
  let upcA = ''
  if (last === '0' || last === '1' || last === '2') {
    upcA = `${ns}${body.slice(0, 2)}${last}0000${body.slice(2, 5)}`
  } else if (last === '3') {
    upcA = `${ns}${body.slice(0, 3)}00000${body.slice(3, 5)}`
  } else if (last === '4') {
    upcA = `${ns}${body.slice(0, 4)}00000${body[4]}`
  } else {
    upcA = `${ns}${body.slice(0, 5)}0000${last}`
  }
  return check ? `${upcA}${check}` : upcA
}

function gs1Prefix(gtin: string): string | undefined {
  const ean = gtin.padStart(13, '0').slice(-13)
  const three = ean.slice(0, 3)
  const two = ean.slice(0, 2)
  return GS1_COUNTRY[three] ? three : GS1_COUNTRY[two] ? two : three
}

function parseGs1AIs(raw: string): Record<string, string> | undefined {
  const gs1: Record<string, string> = {}
  const paren = [...raw.matchAll(/\((\d{2,4})\)([^()]+)/g)]
  for (const match of paren) gs1[match[1]] = match[2].trim()
  const gtinAi = raw.match(/(?:^|[\x1d])01(\d{14})/)
  if (gtinAi) gs1['01'] = gtinAi[1]
  return Object.keys(gs1).length ? gs1 : undefined
}

export function parseBarcode(rawValue: string, format: BarcodeFormat = ''): ParsedBarcode {
  const raw = rawValue.trim()
  const digits = raw.replace(/\D/g, '')
  const fmt = String(format).toLowerCase().replace(/-/g, '_')

  if (fmt.includes('qr') || fmt.includes('data_matrix')) {
    const gs1 = parseGs1AIs(raw)
    const gtin = gs1?.['01']
    return {
      kind: 'qr',
      value: raw,
      gtin,
      checksumValid: gtin ? isValidGtin(gtin) : undefined,
      gs1,
    }
  }

  let gtin = digits
  if (fmt.includes('upc_e') || (digits.length === 8 && fmt.includes('upc'))) {
    gtin = expandUpcE(digits) ?? digits
  }

  const looksLikeGtin = /^\d{8}$|^\d{12,14}$/.test(gtin)
  const asGtin =
    looksLikeGtin &&
    (fmt.includes('ean') ||
      fmt.includes('upc') ||
      fmt.includes('itf') ||
      fmt.includes('code') ||
      !fmt ||
      fmt.includes('unknown') ||
      isValidGtin(gtin))

  if (asGtin) {
    const padded = gtin.length === 12 ? `0${gtin}` : gtin
    const prefix = gs1Prefix(padded)
    return {
      kind: 'gtin',
      value: digits,
      gtin: padded,
      checksumValid: isValidGtin(gtin),
      gs1Prefix: prefix,
      country: prefix ? GS1_COUNTRY[prefix] : undefined,
    }
  }

  if (digits.length >= 4 && digits === raw) {
    return { kind: 'code', value: raw }
  }

  return { kind: raw ? 'code' : 'unknown', value: raw }
}
