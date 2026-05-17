import { useEffect, useMemo, useRef } from 'react'
import { renderMarkdown } from '@/lib/markdown'
import { listMarkdownExtensions } from '@/lib/plugin-runtime'
import { useAppStore } from '@/store/app-store'

export function MarkdownPreview({ value, scrollRatio }: { value: string; scrollRatio?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const markdownExtensionKey = useAppStore((state) => state.plugins.filter((plugin) => plugin.enabled).map((plugin) => `${plugin.id}:${plugin.version}`).join('|'))
  const extensions = useMemo(() => {
    void markdownExtensionKey
    return listMarkdownExtensions()
  }, [markdownExtensionKey])
  const html = useMemo(() => renderMarkdown(value, { extensions }), [extensions, value])
  useEffect(() => {
    if (scrollRatio == null || !ref.current) return
    const el = ref.current
    el.scrollTop = (el.scrollHeight - el.clientHeight) * scrollRatio
  }, [scrollRatio, html])
  return <div ref={ref} className="h-full overflow-auto px-10 py-8"><article className="prose-lightpaper mx-auto" style={{ maxWidth: 'var(--preview-measure)' }} dangerouslySetInnerHTML={{ __html: html }} /></div>
}
