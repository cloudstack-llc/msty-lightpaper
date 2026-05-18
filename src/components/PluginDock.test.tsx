import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PluginDock } from './PluginDock'
import { useAppStore } from '@/store/app-store'

beforeEach(() => {
  useAppStore.setState({ pluginPanels: [] })
})

describe('PluginDock', () => {
  it('mounts registered plugin panel DOM in the requested dock', () => {
    useAppStore.setState({
      pluginPanels: [{
        id: 'test.panel',
        title: 'Test Panel',
        pluginId: 'test.plugin',
        pluginName: 'Test Plugin',
        location: 'right',
        render() {
          const element = document.createElement('section')
          element.textContent = 'Rendered panel content'
          return element
        },
      }],
    })

    render(<PluginDock location="right" />)

    expect(screen.getByText('Test Panel')).toBeInTheDocument()
    expect(screen.getByText('Rendered panel content')).toBeInTheDocument()
  })
})
