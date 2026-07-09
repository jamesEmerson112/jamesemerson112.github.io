import '@fontsource/newsreader/200.css'
import '@fontsource/newsreader/300.css'
import '@fontsource/newsreader/400.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/base.css'
import { inject } from '@vercel/analytics'
import App from './App.svelte'

// Production only: the dev-mode debug script loads from an external domain
// that the CSP meta tag does not allow.
if (import.meta.env.PROD) {
  inject()
}

const app = new App({
  target: document.getElementById('app')!,
})

export default app
