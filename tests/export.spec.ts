import { describe, it, expect, vi } from 'vitest'
import { exportToJSON } from '@/utils/export'

describe('Data Export Utility', () => {
  it('correctly formats data into a JSON structure', () => {
    const data = {
      entries: [
        { id: '1', odometer: 1000, fuelAmount: 50, fuelPrice: 1.5, date: '2025-01-01' }
      ],
      metadata: {
        exportedAt: '2025-01-01T12:00:00Z',
        version: '1.0'
      }
    }

    // Mocking URL and document for download simulation
    const mockCreateObjectURL = vi.fn(() => 'blob:url')
    const mockRevokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL })

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn()
    }
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockAnchor),
      body: { appendChild: vi.fn(), removeChild: vi.fn() }
    })

    exportToJSON(data, 'test-backup')

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockAnchor.download).toBe('test-backup.json')
    expect(mockAnchor.click).toHaveBeenCalled()
  })
})
