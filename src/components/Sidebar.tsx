import { ChevronDown, ChevronRight, FilePlus, FileText, Folder, FolderOpen, FolderPlus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FileNode } from '@shared/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

function NodeRow({ node, depth }: { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1)
  const { activeFile, openFile, createEntry, deleteEntry } = useAppStore()
  const isFolder = node.kind === 'folder'
  const active = activeFile === node.path
  return <div>
    <div className={cn('group flex h-8 w-full items-center gap-1 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground', active && 'bg-primary/15 text-foreground')} style={{ paddingLeft: 8 + depth * 14 }}>
      <button className="flex min-w-0 flex-1 items-center gap-2" onClick={() => isFolder ? setOpen(!open) : openFile(node.path)}>
        {isFolder ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
        {isFolder ? open ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary/80" /> : <FileText className="h-4 w-4 text-accent" />}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && <button title="New file" className="hidden rounded p-1 hover:bg-background group-hover:block" onClick={() => createEntry(node.path, 'file')}><FilePlus className="h-3.5 w-3.5" /></button>}
      {isFolder && <button title="New folder" className="hidden rounded p-1 hover:bg-background group-hover:block" onClick={() => createEntry(node.path, 'folder')}><FolderPlus className="h-3.5 w-3.5" /></button>}
      <button title="Delete" className="hidden rounded p-1 hover:bg-destructive/20 group-hover:block" onClick={() => deleteEntry(node.path)}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
    {isFolder && open && node.children?.map((child) => <NodeRow key={child.id} node={child} depth={depth + 1} />)}
  </div>
}

export function Sidebar() {
  const { activeWorkspace, tree, addWorkspace, loadTree, createEntry } = useAppStore()
  return <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-card/55 backdrop-blur-xl">
    <div className="titlebar-drag h-10 shrink-0" />
    <div className="flex items-center justify-between gap-2 border-b px-3 pb-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">LightPaper</div>
        <div className="truncate text-sm font-semibold">{activeWorkspace?.name ?? 'No workspace'}</div>
      </div>
      <div className="titlebar-no-drag flex gap-1">
        <button title="Add folder" className="rounded-md p-2 hover:bg-muted" onClick={addWorkspace}><Plus className="h-4 w-4" /></button>
        {activeWorkspace && <button title="New note" className="rounded-md p-2 hover:bg-muted" onClick={() => createEntry(activeWorkspace.path, 'file')}><FilePlus className="h-4 w-4" /></button>}
        {activeWorkspace && <button title="New folder" className="rounded-md p-2 hover:bg-muted" onClick={() => createEntry(activeWorkspace.path, 'folder')}><FolderPlus className="h-4 w-4" /></button>}
        <button title="Refresh" className="rounded-md p-2 hover:bg-muted" onClick={() => loadTree()}><RefreshCw className="h-4 w-4" /></button>
      </div>
    </div>
    <div className="flex-1 overflow-auto p-2">
      {!activeWorkspace ? <div className="m-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><p className="mb-3">Add a local folder to start writing. LightPaper maps the tree directly to your files.</p><button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={addWorkspace}>Choose folder</button></div> : tree.length ? tree.map((node) => <NodeRow key={node.id} node={node} depth={0} />) : <div className="p-4 text-sm text-muted-foreground">No markdown files found.</div>}
    </div>
    <div className="border-t p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Hover files/folders for create/delete actions.</div>
    </div>
  </aside>
}
