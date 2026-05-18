export type NoteFrontmatter = {
  cssClasses: string[]
}

function cleanClassName(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function parseArray(value: string) {
  return value
    .slice(1, -1)
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

function parseList(lines: string[], startIndex: number) {
  const values: string[] = []
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*-\s+(.+)$/)
    if (!match) break
    values.push(match[1].trim().replace(/^['"]|['"]$/g, ''))
  }
  return values
}

function valuesFromCssClasses(value: string, lines: string[], index: number) {
  const trimmed = value.trim()
  if (!trimmed) return parseList(lines, index)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return parseArray(trimmed)
  return trimmed.split(/[\s,]+/).filter(Boolean)
}

export function extractNoteFrontmatter(source: string): NoteFrontmatter {
  if (!source.startsWith('---\n')) return { cssClasses: [] }
  const end = source.indexOf('\n---', 4)
  if (end === -1) return { cssClasses: [] }

  const lines = source.slice(4, end).split('\n')
  const classes: string[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(cssClasses|cssclasses|cssclass|class):\s*(.*)$/)
    if (!match) continue
    classes.push(...valuesFromCssClasses(match[2], lines, index))
  }

  return { cssClasses: [...new Set(classes.map(cleanClassName).filter(Boolean))] }
}
