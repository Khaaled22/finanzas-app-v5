// src/tests/setup.js
// ✅ M27: Configuración global para tests
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock window.confirm
global.confirm = vi.fn(() => true)

// Mock window.alert
global.alert = vi.fn()

// Reset mocks antes de cada test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
})