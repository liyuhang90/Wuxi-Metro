// Paths are relative to docs/. Directories end in /; files include .md.
export const searchConfig = {
  exclude: [] as string[] // Example: ['private/', 'draft.md']
}

export function isExcluded(path: string, frontmatter: Record<string, unknown> = {}) {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  return frontmatter.search === false || /(^|\/)404\.md$/i.test(normalized)
    || /(^|\/)(\.vitepress|node_modules|dist|cache)(\/|$)/.test(normalized)
    || searchConfig.exclude.some(rule => rule.endsWith('/') ? normalized.startsWith(rule) : normalized === rule)
}
