import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationsApi } from '../../api/notifications'
import { usePushNotifications } from '../../shared/hooks/usePushNotifications'

export default function NotificacionesConfig() {
  const queryClient = useQueryClient()
  const { isSupported, permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications()

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['notifications', 'config'],
    queryFn: notificationsApi.getConfig,
  })

  const [timeInput, setTimeInput] = useState('')
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (config && !timeInput) setTimeInput(config.notificationTime)
  }, [config])

  const timeChanged = timeInput !== '' && timeInput !== config?.notificationTime

  const updateConfig = useMutation({
    mutationFn: notificationsApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'config'] })
      toast.success('Configuracion guardada')
    },
    onError: () => toast.error('Error al guardar'),
  })

  function handleToggle() {
    if (!config) return
    updateConfig.mutate({ enabled: !config.enabled })
  }

  function handleSaveTime() {
    if (!timeInput) return
    updateConfig.mutate({ notificationTime: timeInput })
  }

  async function handleSubscribe() {
    try {
      await subscribe()
      toast.success('Notificaciones activadas en este dispositivo')
    } catch {
      toast.error('No se pudo activar las notificaciones')
    }
  }

  async function handleUnsubscribe() {
    try {
      await unsubscribe()
      toast.success('Notificaciones desactivadas')
    } catch {
      toast.error('No se pudo desactivar las notificaciones')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
        <span className="icon icon-fill text-[18px] text-terra">notifications</span>
        <span className="font-bold text-[15px]">Notificaciones de pedidos</span>
        {!configLoading && config && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${config.enabled ? 'bg-green-50 text-green-700' : 'bg-sand text-muted'}`}>
            {config.enabled ? 'Activas' : 'Inactivas'}
          </span>
        )}
      </div>

      {configLoading ? (
        <div className="p-4 flex flex-col gap-4">
          <div className="h-10 bg-sand rounded-lg animate-pulse" />
          <div className="h-10 bg-sand rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-espresso">Recordatorio nocturno</p>
              <p className="text-xs text-muted mt-0.5">Aviso la noche anterior con los pedidos del dia siguiente</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config?.enabled ?? false}
              onClick={handleToggle}
              disabled={!config || updateConfig.isPending}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40 cursor-pointer ${config?.enabled ? 'bg-terra' : 'bg-sand-deep'}`}
            >
              <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${config?.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Horario</label>
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-full border border-sand-deep rounded-lg px-3 py-2 text-sm font-semibold text-espresso focus:outline-none focus:border-terra"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveTime}
              disabled={!timeChanged || updateConfig.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-terra text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terra-dark transition-colors"
            >
              <span className="icon text-[16px]">save</span>
              Guardar
            </button>
          </div>

          <div className="border-t border-sand pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Este dispositivo</p>
              <button
                type="button"
                onClick={() => setShowIosHelp(true)}
                className="text-xs font-semibold text-terra hover:text-terra-dark underline underline-offset-2 cursor-pointer"
              >
                Como activar en iPhone
              </button>
            </div>
            {!isSupported ? (
              <p className="text-sm text-muted">Tu navegador no soporta notificaciones push.</p>
            ) : permission === 'denied' ? (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <span className="icon icon-fill text-[16px]">block</span>
                Permiso denegado — habilitalo desde la configuracion del navegador
              </div>
            ) : isSubscribed ? (
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={pushLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-sand-deep text-brown disabled:opacity-40 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                <span className="icon icon-fill text-[16px] text-green-600">notifications_active</span>
                Activo en este dispositivo — desactivar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={pushLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-terra text-white disabled:opacity-40 hover:bg-terra-dark transition-colors"
              >
                <span className="icon text-[16px]">add_alert</span>
                {pushLoading ? 'Activando...' : 'Activar en este dispositivo'}
              </button>
            )}
          </div>
        </div>
      )}

      {showIosHelp && (
        <div
          className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-5 font-sans"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowIosHelp(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowIosHelp(false) }}
        >
          <div className="bg-white rounded-[18px] w-full max-w-[380px] shadow-[0_20px_60px_rgba(44,18,8,0.2)] p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="icon icon-fill text-[28px] text-terra shrink-0">phone_iphone</span>
              <div>
                <h3 className="text-base font-extrabold text-espresso">Activar en iPhone</h3>
                <p className="text-sm text-muted mt-1">
                  iOS solo permite notificaciones si el sitio esta agregado a la pantalla de inicio (requiere iOS 16.4 o superior).
                </p>
              </div>
            </div>
            <ol className="text-sm text-espresso flex flex-col gap-2 list-decimal pl-4">
              <li>Abrir este panel con <strong>Safari</strong> (no funciona desde Chrome en iPhone)</li>
              <li>Tocar el boton <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba)</li>
              <li>Elegir <strong>"Agregar a inicio"</strong></li>
              <li>Abrir la app desde el icono nuevo en la pantalla de inicio (no desde Safari)</li>
              <li>Ahi, tocar <strong>"Activar en este dispositivo"</strong> y aceptar el permiso</li>
            </ol>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-terra text-white hover:bg-terra-dark transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
