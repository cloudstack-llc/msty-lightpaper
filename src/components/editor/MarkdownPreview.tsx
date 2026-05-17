import { useEffect, useMemo, useRef } from 'react'
import { renderMarkdown } from '@/lib/markdown'

export function MarkdownPreview({ value, scrollRatio }: { value: string; scrollRatio?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => renderMarkdown(value), [value])
  useEffect(() => {
    if (scrollRatio == null || !ref.current) return
    const el = ref.current
    el.scrollTop = (el.scrollHeight - el.clientHeight) * scrollRatio
  }, [scrollRatio, html])
  return <div ref={ref} className="h-full overflow-auto px-10 py-8"><article className="prose-lightpaper mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} /></div>
}
