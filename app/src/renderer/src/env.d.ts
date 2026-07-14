import type { PalworldApi } from '../../preload/index'

declare global {
  interface Window {
    palworld: PalworldApi
  }
}

export {}
