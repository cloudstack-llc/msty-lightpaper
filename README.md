# LightPaper

LightPaper is a local-first, plugin-first Markdown editor and previewer built with Electron, React, TypeScript, CodeMirror, and a unified/remark Markdown pipeline.

## Run

```bash
npm install
npm run dev
```

## Check

```bash
npm run typecheck
npm test
```

## Architecture

- [Architecture](/Users/ashokgelal/Projects/lightpaper/docs/ARCHITECTURE.md)
- [Plugin authoring guide](/Users/ashokgelal/Projects/lightpaper/docs/PLUGIN_AUTHORING.md)

## Core Ideas

- Markdown rendering is AST-first through remark and rehype.
- Plugins register explicit contributions through a testable `PluginHost`.
- Plugin permissions are validated before activation and enforced during registration.
- Sample plugins are ordinary TypeScript modules with contract tests.
- AI features are exposed through plugin presets, with an offline Electron fallback for development.
