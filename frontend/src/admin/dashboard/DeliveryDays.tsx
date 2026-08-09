import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { deliveryDiasApi } from '../../api/deliveryDias'
import { useDeliveryDias } from '../../shared/hooks/useDeliveryDias'

const LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const

export default function DeliveryDays() {
  const queryClient = useQueryClient()
  const { dias, isLoading } = useDeliveryDias()
  const [draft, setDraft] = useState<boolean[]>(dias)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    if (!isLoading) setDraft(dias)
  }, [isLoading, dias])

  const activeCount = draft.filter(Boolean).length

  const updateDias = useMutation({
    mutationFn: deliveryDiasApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-dias'] })
      setSaved(true)
      toast.success('Dias de entrega guardados')
    },
    onError: () => toast.error('No se pudo guardar'),
  })

  function handleToggle(i: number) {
    setDraft(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    updateDias.mutate(draft)
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
        <span className="icon icon-fill text-[18px] text-terra">local_shipping</span>
        <span className="font-bold text-[15px]">Dias de entrega</span>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${activeCount === 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {activeCount === 0 ? 'Ningun dia activo' : `${activeCount} dia${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => handleToggle(i)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-semibold cursor-pointer transition-all duration-150 flex-1 min-w-[84px] justify-center border-[1.5px] ${
                draft[i]
                  ? 'bg-terra text-white border-terra shadow-[0_3px_12px_rgba(196,82,42,0.25)]'
                  : 'bg-white text-brown border-sand-deep hover:border-terra hover:text-terra'
              }`}
            >
              <span className="icon text-[16px]">{draft[i] ? 'check_circle' : 'radio_button_unchecked'}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved || updateDias.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 bg-terra text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terra-dark"
          >
            <span className="icon text-[16px]">save</span>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
