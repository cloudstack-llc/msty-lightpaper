import { describe, expect, it } from 'vitest'
import { extractNoteFrontmatter } from './note-frontmatter'

describe('note frontmatter helpers', () => {
  it('extracts Obsidian-style cssClasses from arrays, lists, and strings', () => {
    expect(extractNoteFrontmatter('---\ncssClasses: [cards, table-wide]\n---\n# A').cssClasses).toEqual(['cards', 'table-wide'])
    expect(extractNoteFrontmatter('---\ncssClasses:\n  - img-grid\n  - cards-cols-3\n---\n# A').cssClasses).toEqual(['img-grid', 'cards-cols-3'])
    expect(extractNoteFrontmatter('---\ncssClasses: cards row-alt cards\n---\n# A').cssClasses).toEqual(['cards', 'row-alt'])
  })

  it('sanitizes classes before adding them to preview markup', () => {
    expect(extractNoteFrontmatter('---\ncssClasses: [cards, "../bad", "x y"]\n---\n# A').cssClasses).toEqual(['cards', 'bad', 'x-y'])
  })
})
