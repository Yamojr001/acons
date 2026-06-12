import './bootstrap'
import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 })
router.on('start',  () => NProgress.start())
router.on('finish', () => NProgress.done())
router.on('error',  () => NProgress.done())

const appName = import.meta.env.VITE_APP_NAME ?? 'Ameenatu College of Nursing'

createInertiaApp({
  title: (title) => title ? `${title} · ${appName}` : appName,
  resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
  progress: false,
})
