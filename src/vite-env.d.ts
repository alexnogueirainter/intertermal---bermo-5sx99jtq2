/// <reference types="vite/client" />
import type React from 'react'

declare global {
  const Mail: React.ComponentType<{ className?: string }>
}
