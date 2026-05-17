import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

function splitRow(line: string) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

export function formatMarkdownTable(input: string) {
  const rows = input.trim().split('\n').filter(Boolean).map(splitRow).filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)))
  if (!rows.length) return input
  const width = Math.max(...rows.map((row) => row.length))
  const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => row[index] || ''))
  const widths = Array.from({ length: width }, (_, column) => Math.max(3, ...normalized.map((row) => row[column].length)))
  const render = (row: string[]) => `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`
  const separator = `| ${widths.map((size) => '-'.repeat(size)).join(' | ')} |`
  return [render(normalized[0]), separator, ...normalized.slice(1).map(render)].join('\n')
}

export function delimitedToMarkdownTable(input: string) {
  const delimiter = input.includes('\t') ? '\t' : ','
  const rows = input.trim().split('\n').map((line) => line.split(delimiter).map((cell) => cell.trim()))
  return formatMarkdownTable(rows.map((row) => `| ${row.join(' | ')} |`).join('\n'))
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('table.formatSelection', 'Format Markdown Table', async (ctx) => ctx.replaceSelection(formatMarkdownTable(ctx.selectedText || ctx.documentText || '')))
  api.commands.register('table.csvToMarkdown', 'Convert CSV/TSV to Markdown Table', async (ctx) => ctx.replaceSelection(delimitedToMarkdownTable(ctx.selectedText || 'Column A,Column B\nValue,Value')))
  api.commands.register('table.insertStarter', 'Insert Starter Table', (ctx) => ctx.insertText('\n| Name | Value | Notes |\n| --- | --- | --- |\n|  |  |  |\n'))
}
