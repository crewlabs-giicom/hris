import { createWorker } from 'tesseract.js'

export interface KtpOcrResult {
  nik?: string
  fullName?: string
  ktpAddress?: string
  birthDate?: string // yyyy-mm-dd, best-effort
  religion?: string
  maritalStatus?: string
  gender?: 'male' | 'female'
  bloodType?: string
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', jun: '06',
  jul: '07', agu: '08', sep: '09', okt: '10', nov: '11', des: '12',
}

function parseIndonesianDate(text: string): string | undefined {
  // e.g. "MOJOKERTO, 21-08-1997" or "21-08-1997"
  const numeric = text.match(/(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (numeric) return `${numeric[3]}-${numeric[2]}-${numeric[1]}`
  const named = text.match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{4})/i)
  if (named) {
    const month = MONTHS[named[2].toLowerCase().slice(0, 3)]
    if (month) return `${named[3]}-${month}-${named[1].padStart(2, '0')}`
  }
  return undefined
}

function findLine(lines: string[], label: RegExp): string | undefined {
  const line = lines.find((l) => label.test(l))
  if (!line) return undefined
  return line.replace(label, '').replace(/^[:\s]+/, '').trim() || undefined
}

/**
 * Best-effort OCR read of an Indonesian KTP photo — a prefill aid, not a source of truth.
 * Tesseract's accuracy on KTP's small print + guilloche background is inconsistent, so
 * every field here is meant to be shown to the admin as an editable, reviewable value.
 */
export async function extractKtpFields(filePath: string): Promise<KtpOcrResult> {
  const worker = await createWorker('ind')
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath)

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const result: KtpOcrResult = {}

    const nik = findLine(lines, /^NIK\b/i)
    if (nik) {
      const digits = nik.replace(/\D/g, '')
      if (digits.length >= 15) result.nik = digits.slice(0, 16)
    }

    result.fullName = findLine(lines, /^Nama\b/i)

    const birthLine = findLine(lines, /Tempat\s*\/?\s*Tgl\s*Lahir/i)
    if (birthLine) result.birthDate = parseIndonesianDate(birthLine)

    const genderLine = findLine(lines, /Jenis\s*Kelamin/i)
    if (genderLine) {
      if (/laki/i.test(genderLine)) result.gender = 'male'
      else if (/perempuan/i.test(genderLine)) result.gender = 'female'
    }

    result.ktpAddress = findLine(lines, /^Alamat\b/i)
    result.religion = findLine(lines, /^Agama\b/i)
    result.maritalStatus = findLine(lines, /Status\s*Perkawinan/i)

    const bloodLine = findLine(lines, /Gol\.?\s*Darah/i)
    if (bloodLine) {
      const match = bloodLine.match(/\b(A|B|AB|O)\b/i)
      if (match) result.bloodType = match[1].toUpperCase()
    }

    return result
  } finally {
    await worker.terminate()
  }
}
