import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { LightPaperMarkdownExtension } from '@shared/plugin-api'

export type MarkdownRenderOptions = {
  extensions?: LightPaperMarkdownExtension[]
}

const calloutTypes = new Set(['note', 'tip', 'warning', 'danger', 'ai'])
const allowedPreviewClasses = [
  'markdown-link',
  'wiki-link',
  'callout',
  'callout-title',
  ...Array.from(calloutTypes).map((type) => `callout-${type}`),
]

function calloutTitle(type: string, title?: string) {
  return title?.trim() || type.toUpperCase()
}

function remarkLightPaperCallouts() {
  return (tree: unknown) => {
    visit(tree, (node: any) => {
      if (node.type === 'blockquote') {
        const first = node.children?.[0]
        const firstText = first?.children?.[0]
        if (first?.type !== 'paragraph' || firstText?.type !== 'text') return

        const text = String(firstText.value)
        const firstLine = text.split('\n')[0] ?? ''
        const match = firstLine.match(/^\[!(NOTE|TIP|WARNING|DANGER|AI)\]\s*(.*)$/i)
        if (!match) return

        const type = match[1].toLowerCase()
        const remainingText = text.slice(firstLine.length).replace(/^\n/, '')
        firstText.value = calloutTitle(type, match[2])
        first.data = {
          ...first.data,
          hProperties: { ...(first.data?.hProperties ?? {}), className: ['callout-title'] },
        }
        if (remainingText.trim()) {
          node.children.splice(1, 0, { type: 'paragraph', children: [{ type: 'text', value: remainingText }] })
        }
        node.data = {
          ...node.data,
          hName: 'aside',
          hProperties: { ...(node.data?.hProperties ?? {}), className: ['callout', `callout-${type}`], dataCallout: type },
        }
      }

      if (node.type === 'containerDirective' && calloutTypes.has(String(node.name).toLowerCase())) {
        const type = String(node.name).toLowerCase()
        node.data = {
          ...node.data,
          hName: 'aside',
          hProperties: { ...(node.data?.hProperties ?? {}), className: ['callout', `callout-${type}`], dataCallout: type },
        }
        node.children = [
          {
            type: 'paragraph',
            data: { hProperties: { className: ['callout-title'] } },
            children: [{ type: 'text', value: calloutTitle(type, node.attributes?.title ?? node.attributes?.label) }],
          },
          ...(node.children ?? []),
        ]
      }
    })
  }
}

function rehypeLinkPolicy() {
  return (tree: unknown) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'a') return
      const href = String(node.properties?.href ?? '')
      node.properties = {
        ...(node.properties ?? {}),
        className: [...new Set([...(node.properties?.className ?? []), href.startsWith('lightpaper://wiki/') ? 'wiki-link' : 'markdown-link'])],
      }
      if (/^https?:\/\//i.test(href)) {
        node.properties.target = '_blank'
        node.properties.rel = ['nofollow', 'noopener', 'noreferrer']
      }
    })
  }
}

const lightPaperSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'aside'],
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), 'lightpaper'],
  },
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] ?? []),
      ['className', ...allowedPreviewClasses],
      ['dataCallout'],
      ['dataWikiTarget'],
    ],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ['className', ...allowedPreviewClasses],
      ['target'],
      ['rel'],
      ['dataWikiTarget'],
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-./, 'hljs'],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', /^hljs-./],
    ],
  },
}

export function createMarkdownProcessor(options: MarkdownRenderOptions = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkDirective)
    .use(remarkLightPaperCallouts)

  for (const extension of options.extensions?.filter((item) => item.kind === 'remark') ?? []) {
    extension.apply(processor as any)
  }

  processor
    .use(remarkRehype)

  for (const extension of options.extensions?.filter((item) => item.kind === 'rehype') ?? []) {
    extension.apply(processor as any)
  }

  return processor
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeSanitize as any, lightPaperSanitizeSchema)
    .use(rehypeLinkPolicy)
    .use(rehypeStringify)
}

export function renderMarkdown(source: string, options: MarkdownRenderOptions = {}) {
  return String(createMarkdownProcessor(options).processSync(source))
}
