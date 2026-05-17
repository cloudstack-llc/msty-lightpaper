import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useRef } from 'react'

const lightpaperHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.55em', fontWeight: '800', color: 'hsl(var(--primary))' },
  { tag: tags.heading2, fontSize: '1.28em', fontWeight: '750', color: 'hsl(var(--accent))' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '800' },
  { tag: tags.link, color: 'hsl(var(--accent))', textDecoration: 'underline' },
  { tag: tags.monospace, color: 'hsl(var(--primary))' },
])

export function MarkdownEditor({ value, onChange, onScroll }: { value: string; onChange(value: string): void; onScroll?(ratio: number): void }) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!host.current) return
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), history(), drawSelection(), indentOnInput(), bracketMatching(), highlightActiveLine(), markdown(), syntaxHighlighting(lightpaperHighlight),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => { if (update.docChanged) onChangeRef.current(update.state.doc.toString()) }),
          EditorView.domEventHandlers({ scroll: (_event, view) => { const el = view.scrollDOM; const max = el.scrollHeight - el.clientHeight; onScroll?.(max <= 0 ? 0 : el.scrollTop / max) } }),
          EditorView.theme({ '&': { height: '100%' }, '.cm-content': { caretColor: 'hsl(var(--primary))' }, '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))' }, '.cm-selectionBackground': { background: 'hsl(var(--primary) / .28) !important' }, '.cm-activeLine': { background: 'hsl(var(--muted) / .35)' }, '.cm-activeLineGutter': { background: 'hsl(var(--muted) / .35)' } })
        ],
      }),
    })
    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [value])

  return <div className="h-full" ref={host} />
}
