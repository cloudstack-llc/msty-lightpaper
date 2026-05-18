import { useEffect } from 'react'
import { cssAssetsForThemes } from '@/lib/plugin-theme-assets'
import { useAppStore } from '@/store/app-store'

function findStyleNode(key: string) {
  return [...document.head.querySelectorAll<HTMLStyleElement>('style[data-lightpaper-plugin-theme]')]
    .find((node) => node.dataset.lightpaperPluginTheme === key)
}

export function PluginThemeStyles() {
  const pluginThemes = useAppStore((state) => state.pluginThemes)

  useEffect(() => {
    const assets = cssAssetsForThemes(pluginThemes)
    const mounted = new Set<string>()

    for (const asset of assets) {
      const node = findStyleNode(asset.key) ?? document.createElement('style')
      node.dataset.lightpaperPluginTheme = asset.key
      node.textContent = asset.css
      if (!node.parentNode) document.head.appendChild(node)
      mounted.add(asset.key)
    }

    return () => {
      for (const key of mounted) findStyleNode(key)?.remove()
    }
  }, [pluginThemes])

  return null
}
