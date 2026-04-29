import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../api/axios'
import AdminLayout from '../AdminLayout'
import Toggle from '../../shared/components/Toggle'
import type { Banner } from '../../menu/hooks/useBanner'

const schema = z.object({
  titulo: z.string().min(1, 'El titulo es requerido'),
  linea1: z.string(),
  linea2: z.string(),
  activo: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function BannerPage() {
  const qc = useQueryClient()
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner'],
    queryFn: async () => {
      const res = await api.get<Banner>('/api/banner')
      return res.data
    },
  })

  const update = useMutation({
    mutationFn: (data: FormData) => api.put('/api/admin/banner', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banner'] })
      showToast('Banner actualizado')
    },
    onError: () => showToast('Error al guardar', true),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', linea1: '', linea2: '', activo: true },
  })

  useEffect(() => {
    if (banner) reset(banner)
  }, [banner, reset])

  const activo = watch('activo')

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5 border-b border-sand-deep">
        <h1 className="text-[22px] font-extrabold text-espresso">Banner de descuentos</h1>
        <p className="text-sm text-muted mt-1">
          Texto que aparece en el encabezado del menu publico.
        </p>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-[560px]">
        {isLoading ? (
          <div className="text-center p-10 text-muted">Cargando…</div>
        ) : (
          <form onSubmit={handleSubmit((data) => update.mutate(data))} className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(44,18,8,0.06)] p-6 flex flex-col gap-4">

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Estado del banner
              </label>
              <div className="flex items-center gap-2.5 h-[44px]">
                <Toggle
                  checked={activo}
                  onChange={() => setValue('activo', !activo)}
                  label={activo ? 'Desactivar banner' : 'Activar banner'}
                />
                <span className={`text-[13px] font-semibold ${activo ? 'text-green-700' : 'text-muted'}`}>
                  {activo ? 'Visible en el menu' : 'Oculto'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="banner-titulo" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Titulo
              </label>
              <input
                id="banner-titulo"
                type="text"
                {...register('titulo')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
              {errors.titulo && <span className="text-xs text-red-600 mt-1 block">{errors.titulo.message}</span>}
            </div>

            <div>
              <label htmlFor="banner-linea1" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Linea 1
              </label>
              <input
                id="banner-linea1"
                type="text"
                placeholder="+5 unidades: 5% de descuento"
                {...register('linea1')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
            </div>

            <div>
              <label htmlFor="banner-linea2" className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Linea 2
              </label>
              <input
                id="banner-linea2"
                type="text"
                placeholder="+10 unidades: 25% de descuento"
                {...register('linea2')}
                className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-cream outline-none focus:border-terra"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-brown mb-1.5">
                Vista previa
              </label>
              {activo ? (
                <div className="bg-gold rounded-[10px] px-4 py-3 text-espresso text-center">
                  <div className="text-xs font-bold mb-1">{watch('titulo') || '—'}</div>
                  {watch('linea1') && <div className="text-[11.5px] font-bold">{watch('linea1')}</div>}
                  {watch('linea2') && <div className="text-[11.5px] font-bold">{watch('linea2')}</div>}
                </div>
              ) : (
                <div className="bg-sand rounded-[10px] px-4 py-3 text-center text-muted text-sm">
                  Banner oculto — no aparece en el menu
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-sand">
              <button
                type="submit"
                disabled={update.isPending}
                className={`px-5 py-2.5 rounded-[10px] border-none font-sans text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors ${update.isPending ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
              >
                <span className="icon icon-fill text-[17px]">save</span>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(44,18,8,0.15)] flex items-center gap-2 font-sans text-sm font-semibold z-50 border-l-[3px] ${toast.error ? 'border-red-600' : 'border-green-700'}`}>
          <span className={`icon icon-fill text-[18px] ${toast.error ? 'text-red-600' : 'text-green-700'}`}>
            {toast.error ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
