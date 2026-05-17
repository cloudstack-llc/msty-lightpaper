/// <reference types="vite/client" />
import type { LightPaperBridge } from '../electron/preload'
declare global { interface Window { lightpaper: LightPaperBridge } }
