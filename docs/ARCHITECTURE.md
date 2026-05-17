# LightPaper Architecture

LightPaper is a local-first, plugin-first Markdown studio.

## Stack
- Electron latest runtime for cross-platform desktop.
- React + Vite + TypeScript for UI.
- CodeMirror 6 for fast editing.
- markdown-it renderer with task lists, anchors, footnotes, syntax highlighting.
- SQLite via better-sqlite3 for app metadata, settings, plugin registry, note metadata.
- Tailwind/shadcn-style primitives for the design system.

## Plugin model
Plugins are manifest-first packages. A plugin declares permissions and contributions:

```json
{
  "id": "lightpaper.example",
  "name": "Example",
  "version": "1.0.0",
  "permissions": ["commands", "markdown", "ai", "ui", "metadata", "filesystem"],
  "contributes": {
    "commands": [{ "id": "example.run", "title": "Run Example" }],
    "aiPresets": [{ "id": "tighten", "label": "Tighten prose", "prompt": "...", "scope": "selection" }],
    "panels": [{ "id": "graph", "title": "Graph", "location": "right" }],
    "themes": [{ "id": "dracula-paper", "label": "Dracula Paper", "cssFile": "theme.css" }]
  }
}
```

The API surface is intentionally broad: commands, Markdown render hooks, AI presets/providers, metadata, and UI panels. The current app seeds built-in plugin records and defines contracts in `src/shared/plugin-api.ts`; dynamic plugin loading is the next implementation slice.

## AI ideas baked into the design
- Provider plugins: OpenAI-compatible endpoints, Ollama/local models, Anthropic, custom company gateway.
- AI command presets: summarize, tag, rewrite, critique, outline, continue, convert meeting notes to tasks.
- Inline transforms: selected text can be rewritten, shortened, expanded, translated, or tone-shifted.
- Metadata intelligence: auto tags, summaries, related-note suggestions, backlinks, stale-note detection.
- Writing coach plugins: style guide enforcement, reading level, argument gaps, contradiction finder.
- Knowledge workflows: turn folder into a map, generate index notes, synthesize weekly journals.

## Safety
The Electron preload exposes a narrow API. File operations are checked to remain inside the selected workspace. Plugin permissions are explicit so the loader can enforce capability boundaries.
