import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}
window.IntersectionObserver = MockIntersectionObserver

// Mock ResizeObserver
class MockResizeObserver {
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}
window.ResizeObserver = MockResizeObserver

// Mock scrollTo
window.scrollTo = vi.fn()
