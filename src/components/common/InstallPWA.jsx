import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Escuchar el evento beforeinstallprompt
    const handler = (e) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App already installed')
      setShowInstallPrompt(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available')
      return
    }

    // Mostrar el prompt nativo
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA: User response: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('PWA: User accepted installation')
    }

    // Limpiar el prompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Guardar en localStorage que el usuario cerró el prompt
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // No mostrar si el usuario ya lo cerró en las últimas 24 horas
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dayInMs = 24 * 60 * 60 * 1000
      if (Date.now() - parseInt(dismissed) < dayInMs) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-3">
              <i className="fas fa-mobile-alt text-2xl"></i>
            </div>
            <div>
              <h3 className="font-bold text-lg">Instalar Finanzas PRO</h3>
              <p className="text-sm opacity-90">Acceso rápido desde tu pantalla</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <ul className="text-sm space-y-2 mb-4 opacity-90">
          <li className="flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            Funciona sin conexión
          </li>
          <li className="flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            Acceso rápido desde tu inicio
          </li>
          <li className="flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            Actualizaciones automáticas
          </li>
        </ul>

        <button
          onClick={handleInstallClick}
          className="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all shadow-lg"
        >
          <i className="fas fa-download mr-2"></i>
          Instalar Ahora
        </button>
      </div>
    </div>
  )
}