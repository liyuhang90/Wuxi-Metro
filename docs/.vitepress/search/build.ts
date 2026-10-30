import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5'
import type MarkdownIt from 'markdown-it'
import type { SiteConfig } from 'vitepress'
import type { Plugin } from 'vite'
import MiniSearch from 'minisearch'
import { isExcluded } from './config'
import { searchOptions, type SearchBlock, type SearchPayload } from './shared'

type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']
interface Page { path: string; title: string; blocks: Omit<SearchBlock, 'path' | 'id' | 'pageTitle'>[] }

function textContent(node: Node): string {
  if (node.nodeName === '#text') return (node as DefaultTreeAdapterMap['textNode']).value
  const el = node as Element
  if (['script', 'style', 'button'].includes(el.tagName) || el.attrs?.some(a => a.name === 'aria-hidden' && a.value === 'true')) return ''
  return 'childNodes' in node ? node.childNodes.map(textContent).join(el.tagName === 'tr' ? ' ' : '') : ''
}
function attr(node: Element, name: string) { return node.attrs?.find(a => a.name === name)?.value }

export function createSearchIntegration() {
  const pages = new Map<string, Page>()
  let revision = 0
  let cached: { revision: number; base: string; clean: boolean; json: string } | undefined

  function markdown(md: MarkdownIt) {
    md.core.ruler.push('independent-search-targets', state => {
      const counts = new Map<string, number>()
      for (const token of state.tokens) {
        if (!['heading_open', 'paragraph_open', 'list_item_open', 'tr_open', 'fence', 'code_block'].includes(token.type) || token.hidden) continue
        const source = token.map ? state.src.split('\n').slice(...token.map).join('\n') : token.content
        const hash = createHash('sha256').update(`${token.type}\0${source}`).digest('hex').slice(0, 14)
        const occurrence = counts.get(hash) || 0
        counts.set(hash, occurrence + 1)
        token.attrSet('data-search-id', `search-${hash}-${occurrence}`)
      }
    })
    // Code renderers do not forward token attrs; decorate their outer block explicitly.
    for (const name of ['fence', 'code_block']) {
      const original = md.renderer.rules[name]!
      md.renderer.rules[name] = (tokens, index, options, env, renderer) => {
        const html = original(tokens, index, options, env, renderer)
        const target = tokens[index].attrGet('data-search-id')
        return target ? html.replace(/^<(div|pre)\b/, `<$1 data-search-id="${target}"`) : html
      }
    }
    const render = md.render.bind(md)
    md.render = (source, env = {}) => {
      const html = render(source, env)
      if (!env.relativePath || isExcluded(env.relativePath, env.frontmatter)) {
        if (env.relativePath) pages.delete(env.relativePath)
        revision++
        return html
      }
      const tree = parseFragment(html)
      const blocks: Page['blocks'] = []
      let section = ''
      function visit(node: Node) {
        const el = node as Element
        const target = attr(el, 'data-search-id')
        const text = textContent(el).replace(/\u200b/g, '').replace(/\s+/g, ' ').trim()
        if (/^h[1-6]$/.test(el.tagName || '')) section = text
        // Prefer nested paragraphs for loose lists; tight list items have no rendered P.
        const hasNestedTarget = (el.childNodes || []).some(child => attr(child as Element, 'data-search-id'))
        if (target && text && !(el.tagName === 'li' && hasNestedTarget)) {
          const heading = /^h[1-6]$/.test(el.tagName || '')
          const code = el.tagName === 'pre' || (attr(el, 'class') || '').includes('language-')
          blocks.push({ target, section, title: '', heading: heading ? text : '', text: heading || code ? '' : text, code: code ? text : '', excerpt: '' })
        }
        if ('childNodes' in node) node.childNodes.forEach(visit)
      }
      tree.childNodes.forEach(visit)
      // Context is stored separately from indexed fields: a heading hit shows its
      // nearby body without making every paragraph match that heading again.
      blocks.forEach((block, index) => {
        if (block.heading) {
          const next = blocks[index + 1]
          if (next && !next.heading) block.excerpt = (next.text || next.code).slice(0, 240)
        }
      })
      const title = String(env.frontmatter?.title || env.title || env.relativePath.replace(/\/index\.md$|\.md$/g, '') || '首页')
      const titleTarget = blocks.find(block => block.heading === env.title)?.target || 'search-page'
      const excerpt = blocks.find(block => block.text)?.text.slice(0, 240)
        || String(env.frontmatter?.hero?.text || '')
      blocks.unshift({ target: titleTarget, section: '', title, heading: '', text: '', code: '', excerpt })
      pages.set(env.relativePath, { path: env.relativePath, title, blocks })
      revision++
      return `<span data-search-id="search-page" aria-hidden="true"></span>${html}`
    }
  }

  function payload(base: string, clean: boolean): string {
    if (cached?.revision === revision && cached.base === base && cached.clean === clean) return cached.json
    const engine = new MiniSearch<SearchBlock>(searchOptions)
    for (const page of [...pages.values()].sort((a, b) => a.path.localeCompare(b.path))) {
      const path = base + page.path.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, clean ? '' : '.html')
      engine.addAll(page.blocks.map((block, index) => ({ ...block, path, pageTitle: page.title, id: `${path}:${index}` })))
    }
    const json = JSON.stringify({ version: 1, index: engine.toJSON() } satisfies SearchPayload)
    cached = { revision, base, clean, json }
    return json
  }

  async function buildEnd(config: SiteConfig) {
    await mkdir(config.outDir, { recursive: true })
    const json = payload(config.site.base, !!config.cleanUrls)
    await writeFile(join(config.outDir, 'search-index.json'), json)
    config.logger.info(`Search: ${pages.size} pages, ${(Buffer.byteLength(json) / 1024).toFixed(1)} KiB static index`)
  }

  const plugin: Plugin = {
    name: 'independent-local-search',
    // This lazy client dependency must be prebundled before the first dialog opens,
    // otherwise Vite can reload the page while the user is typing in development.
    config: () => ({ optimizeDeps: { include: ['minisearch'] } }),
    configureServer(server) {
      const config = (server.config as typeof server.config & { vitepress: SiteConfig }).vitepress
      let scan: Promise<void> | undefined
      let dirty = true
      server.watcher.on('all', (event, file) => {
        if (file.endsWith('.md')) {
          dirty = true
          if (event === 'unlink') {
            for (const key of pages.keys()) if (file.replace(/\\/g, '/').endsWith('/' + key)) pages.delete(key)
            revision++
          }
        }
      })
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.split('?')[0].endsWith('/search-index.json')) return next()
        try {
          if (dirty && !scan) {
            dirty = false
            scan = (async () => {
              for (const page of config.pages) if (!isExcluded(page)) await server.transformRequest('/' + page)
            })().finally(() => { scan = undefined })
          }
          await scan
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(payload(config.site.base, !!config.cleanUrls))
        } catch (error) {
          dirty = true
          config.logger.error(String(error))
          res.statusCode = 500
          res.end('Search index generation failed')
        }
      })
    }
  }
  return { markdown, buildEnd, plugin }
}
