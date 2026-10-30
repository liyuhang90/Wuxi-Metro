import MiniSearch from 'minisearch'

export interface SearchBlock {
  id: string
  path: string
  target: string
  pageTitle: string
  section: string
  title: string
  heading: string
  text: string
  code: string
  excerpt: string
}
export interface SearchPayload { version: 1; index: ReturnType<MiniSearch['toJSON']> }
export interface SearchHit extends SearchBlock { score: number; terms: string[] }
export interface SearchGroup { path: string; title: string; hits: SearchHit[] }

export const normalize = (text: string) => text.normalize('NFKC').toLowerCase()
export const words = (text: string) => normalize(text).match(/[\p{Script=Han}]+|(?:(?!\p{Script=Han})[\p{L}\p{N}_])+/gu) || []

// Han unigrams give arbitrary substring recall; consecutive-run verification below
// prevents scattered characters or reversed words from becoming false positives.
export function tokenize(text: string): string[] {
  return words(text).flatMap(word => /\p{Script=Han}/u.test(word) ? [...word] : [word])
}
export const searchOptions = {
  fields: ['title', 'heading', 'text', 'code'],
  storeFields: ['path', 'target', 'pageTitle', 'section', 'title', 'heading', 'text', 'code', 'excerpt'],
  tokenize,
  processTerm: (term: string) => normalize(term)
}

export function canonicalPath(path: string): string {
  let value = path.split(/[?#]/)[0]
  try { value = decodeURIComponent(value) } catch { /* tolerate malformed incoming URLs */ }
  return value.replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/'
}

export function search(engine: MiniSearch<SearchBlock>, query: string, currentPath?: string): SearchGroup[] {
  const parts = words(query.slice(0, 200))
  if (!parts.length) return []
  const results = engine.search(query.slice(0, 200), {
    combineWith: 'AND',
    prefix: term => !/\p{Script=Han}/u.test(term) && term.length >= 2,
    fuzzy: term => /^[a-z]{4,}$/i.test(term) ? 1 : false,
    boost: { title: 12, heading: 6, text: 2, code: 0.5 },
    filter: result => !currentPath || canonicalPath(result.path) === canonicalPath(currentPath)
  })
  const phrase = normalize(query.trim()).replace(/\s+/g, ' ')
  const hits: SearchHit[] = []
  for (const result of results) {
    const block = result as unknown as SearchHit
    const fields = [block.title, block.heading, block.text, block.code].map(normalize)
    const allText = fields.join(' ')
    if (!parts.filter(part => /\p{Script=Han}/u.test(part)).every(part => allText.includes(part))) continue
    const exactTerms = parts.every(part => allText.includes(part))
    const tier = fields[0] === phrase ? 6 : fields[0].includes(phrase) ? 5
      : fields[1].includes(phrase) ? 4 : fields[2].includes(phrase) ? 3 : exactTerms ? 2 : 1
    hits.push({ ...block, score: tier * 1e6 + Math.min(result.score, 999999), terms: [...new Set([...parts, ...result.terms.filter(term => !/\p{Script=Han}/u.test(term))])] })
  }
  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  const groups = new Map<string, SearchGroup>()
  for (const hit of hits) {
    let group = groups.get(hit.path)
    if (!group) groups.set(hit.path, group = { path: hit.path, title: hit.pageTitle, hits: [] })
    // A page title and its H1 share a target, so expose that position only once.
    if (!group.hits.some(existing => existing.target === hit.target)) group.hits.push(hit)
  }
  return [...groups.values()]
}

export function highlightParts(text: string, terms: string[]) {
  // Keep an offset map so NFKC expansion (e.g. full-width letters) cannot corrupt slices.
  let normalized = ''
  const offsets: number[] = []
  let offset = 0
  for (const char of text) {
    const value = normalize(char)
    normalized += value
    for (let i = 0; i < value.length; i++) offsets.push(offset)
    offset += char.length
  }
  offsets.push(text.length)
  const marked = new Uint8Array(text.length)
  for (const term of new Set(terms.map(normalize).filter(Boolean))) {
    let start = normalized.indexOf(term)
    while (start >= 0) {
      const end = offsets[start + term.length] ?? text.length
      marked.fill(1, offsets[start], end)
      start = normalized.indexOf(term, start + Math.max(term.length, 1))
    }
  }
  const chunks: { text: string; match: boolean }[] = []
  for (let i = 0; i < text.length;) {
    let end = i + 1
    while (end < text.length && marked[end] === marked[i]) end++
    chunks.push({ text: text.slice(i, end), match: !!marked[i] })
    i = end
  }
  return chunks
}

export function snippet(hit: SearchHit): string {
  const text = hit.text || hit.code || hit.excerpt || hit.heading || hit.title
  const chunks = highlightParts(text, hit.terms)
  let first = 0
  for (const chunk of chunks) { if (chunk.match) break; first += chunk.text.length }
  const start = first === text.length ? 0 : Math.max(0, first - 45)
  return (start ? '…' : '') + text.slice(start, start + 180) + (start + 180 < text.length ? '…' : '')
}
