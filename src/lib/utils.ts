import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function basename(path: string) { return path.split(/[\\/]/).pop() ?? path }
export function titleFromMarkdown(content: string, fallback: string) { return content.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback.replace(/\.(md|markdown|mdx|txt)$/i, '') }
export function wordCount(content: string) { return content.trim() ? content.trim().split(/\s+/).length : 0 }
