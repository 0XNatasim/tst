import { parse } from "csv-parse/sync"

export type Row = Record<string, string>

/** Fetch a remote CSV and parse it into an array of string-keyed rows.
 * Headers are lower-cased and trimmed so lookups are case-insensitive. */
export async function fetchCsv(url: string, signal?: AbortSignal): Promise<Row[]> {
  const res = await fetch(url, { signal, redirect: "follow" })
  if (!res.ok) {
    throw new Error(`Fetch failed for ${url}: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  const records = parse(text, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    bom: true,
    delimiter: detectDelimiter(text),
    trim: true,
  }) as Row[]
  return records
}

function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? ""
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

/** Read the first non-empty value among several candidate column names. */
export function field(row: Row, ...candidates: string[]): string | undefined {
  for (const c of candidates) {
    const v = row[c.toLowerCase()]
    if (v != null && v.trim() !== "") return v.trim()
  }
  return undefined
}

/** Parse a French/English money string ("1 234 567,89 $", "$1,234.56") to a
 * canonical decimal string suitable for a numeric column, or undefined. */
export function money(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let s = raw.replace(/[^\d.,-]/g, "")
  if (!s) return undefined
  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")
  if (lastComma > lastDot) {
    // European format: "1.234.567,89" -> dot=thousands, comma=decimal
    s = s.replace(/\./g, "").replace(",", ".")
  } else {
    // Anglo format: "1,234,567.89" -> comma=thousands
    s = s.replace(/,/g, "")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n.toFixed(2) : undefined
}

/** Parse a date string in common QC open-data formats to a Date, or undefined. */
export function date(raw: string | undefined): Date | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  // ISO-ish: 2024-01-31 or 2024-01-31T...
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`)
    return isNaN(d.getTime()) ? undefined : d
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`)
    return isNaN(d.getTime()) ? undefined : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
