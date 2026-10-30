import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import MiniSearch from 'minisearch'
import { searchOptions, search, canonicalPath, highlightParts, snippet, type SearchBlock } from '../docs/.vitepress/search/shared'
import { isExcluded, searchConfig } from '../docs/.vitepress/search/config'

const dist = 'tests/fixtures/.vitepress/dist'
const fixture = await readFile(join(dist, 'search-index.json'), 'utf8')
const engine = MiniSearch.loadJSON<SearchBlock>(JSON.stringify(JSON.parse(fixture).index), searchOptions)
const hits = (query: string, path?: string) => search(engine, query, path).flatMap(group => group.hits)

test('Chinese contiguous substrings, mixed terms, English prefix/case/typo and multi-word AND', () => {
  assert.ok(hits('无锡地铁').length)
  assert.ok(hits('锡地').length)
  assert.ok(hits('无锡 S1').length)
  assert.ok(hits('S1').some(hit => hit.text.includes('地铁S1线')))
  assert.ok(hits('railway').some(hit => hit.text.includes('铁路Railway交通')))
  assert.ok(hits('地铁S1线').length)
  assert.ok(hits('WUXI railway').length)
  assert.ok(hits('railw').length)
  assert.ok(hits('railwey').length)
  assert.equal(hits('无锡 railway nonexistentword').length, 0)
  assert.equal(hits('s').length, 0)
  assert.equal(hits('无锡地铁').some(hit => hit.section === '顺序校验'), false)
})
test('scope, grouping, exact ranking, duplicate positions and actual excerpts', () => {
  assert.equal(hits('独属于其他页面', '/metro-test/index?x=1#heading').length, 0)
  assert.equal(hits('独属于其他页面', '/metro-test/other.html').length, 1)
  assert.equal(search(engine, '无锡地铁搜索验收')[0].hits[0].title, '无锡地铁搜索验收')
  assert.equal(snippet(search(engine, '无锡地铁搜索验收')[0].hits[0]), '欢迎使用静态全文搜索。')
  const duplicates = hits('重复段落独特词')
  assert.equal(duplicates.length, 2)
  assert.notEqual(duplicates[0].target, duplicates[1].target)
  assert.ok(snippet(duplicates[0]).includes('重复段落独特词'))
})
test('tables, code, lists and exclusions', () => {
  assert.ok(hits('表格专用词').length)
  assert.ok(hits('CodeOnlyToken').length)
  assert.ok(hits('列表专用词').length)
  assert.equal(hits('绝对不应被索引').length, 0)
  assert.equal(hits('四零四').length, 0)
  searchConfig.exclude.push('private/', 'draft.md')
  try {
    for (const file of ['private/test.md', 'draft.md', '404.md', '.vitepress/secret.md', 'node_modules/a.md']) assert.ok(isExcluded(file))
    assert.equal(isExcluded('public/private.md'), false)
    assert.ok(isExcluded('page.md', { search: false }))
  } finally { searchConfig.exclude.splice(0) }
})
test('every built index target is present in its real HTML, including duplicate text', async () => {
  const rows = JSON.parse(fixture).index.storedFields as Record<string, SearchBlock>
  for (const row of Object.values(rows)) {
    const relative = row.path.replace('/metro-test/', '') || 'index'
    const html = await readFile(join(dist, `${relative}.html`), 'utf8')
    assert.ok(html.includes(`data-search-id="${row.target}"`), row.target)
  }
})
test('highlight normalization remains safe text and URLs normalize query/hash/index aliases', () => {
  assert.equal(canonicalPath('/metro-test/index.html?x=1#h'), '/metro-test')
  assert.equal(canonicalPath('/metro-test/other.html#h'), '/metro-test/other')
  const input = 'ＡＢＣ <img onerror=alert(1)> 铁路'
  const parts = highlightParts(input, ['abc', '铁路'])
  assert.equal(parts.map(part => part.text).join(''), input)
  assert.deepEqual(parts.filter(part => part.match).map(part => part.text), ['ＡＢＣ', '铁路'])
})
test('relevance orders exact title, partial title, heading, body, code and fuzzy hits', () => {
  const ranked = new MiniSearch<SearchBlock>(searchOptions)
  const documents = [
    { title: 'Railway' }, { title: 'Railway Museum' }, { heading: 'Railway' },
    { text: 'Railway' }, { code: 'Railway' }, { text: 'Railwey' }
  ].map((fields, index) => ({ id: String(index), path: `/p${index}`, target: 'search-page', pageTitle: `page ${index}`, section: '', title: '', heading: '', text: '', code: '', excerpt: '', ...fields }))
  ranked.addAll(documents)
  assert.deepEqual(search(ranked, 'Railway').map(group => group.path), ['/p0', '/p1', '/p2', '/p3', '/p4', '/p5'])
})
test('real project queries and browser-size budget', async () => {
  const json = await readFile('docs/.vitepress/dist/search-index.json', 'utf8')
  const real = MiniSearch.loadJSON<SearchBlock>(JSON.stringify(JSON.parse(json).index), searchOptions)
  assert.ok(search(real, '无锡火车站').length)
  assert.ok(search(real, 'S1线').length)
  const stored = JSON.parse(json).index.storedFields as Record<string, SearchBlock>
  const htmlByPath = new Map<string, string>()
  for (const row of Object.values(stored)) {
    if (!htmlByPath.has(row.path)) {
      const relative = row.path.endsWith('/') ? `${row.path}index` : row.path
      htmlByPath.set(row.path, await readFile(join('docs/.vitepress/dist', `${relative.slice(1)}.html`), 'utf8'))
    }
    assert.ok(htmlByPath.get(row.path)!.includes(`data-search-id="${row.target}"`), `${row.path}#${row.target}`)
  }
  const samples: number[] = []
  for (let i = 0; i < 30; i++) {
    const start = performance.now()
    search(real, ['无锡', 'S1线', 'railwey', '地铁 开通'][i % 4])
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  console.log(`Index: ${Buffer.byteLength(json)} bytes, gzip ${gzipSync(json).length} bytes; query p95 ${samples[28].toFixed(2)}ms`)
  assert.ok(samples[28] < 100, 'search should stay below the 140 ms debounce on this machine')
})
