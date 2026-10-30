import MiniSearch from 'minisearch'
import { searchOptions, type SearchBlock, type SearchPayload } from './shared'

const engines = new Map<string, Promise<MiniSearch<SearchBlock>>>()
export function loadSearch(base: string, fresh = false): Promise<MiniSearch<SearchBlock>> {
  if (fresh) engines.delete(base)
  let pending = engines.get(base)
  if (!pending) {
    pending = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      try {
        const response = await fetch(`${base}search-index.json`, { signal: controller.signal, cache: 'no-cache' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json() as SearchPayload
        if (data.version !== 1 || !data.index) throw new Error('Unsupported search index')
        return await MiniSearch.loadJSONAsync<SearchBlock>(JSON.stringify(data.index), searchOptions)
      } finally { clearTimeout(timeout) }
    })().catch(error => { engines.delete(base); throw error })
    engines.set(base, pending)
  }
  return pending
}
