import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { mercadopagoApi } from '../../api/mercadopago'

export default function MercadoPagoConexion() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['mercadopago', 'status'],
    queryFn: mercadopagoApi.getStatus,
  })

  const authorize = useMutation({
    mutationFn: mercadopagoApi.authorize,
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (error) => {
      const msg = (error as AxiosError<{ error: string }>).response?.data?.error ?? 'No se pudo iniciar la conexion con Mercado Pago'
      toast.error(msg)
    },
  })

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
        <span className="icon icon-fill text-[18px] text-terra">account_balance_wallet</span>
        <span className="font-bold text-[15px]">Mercado Pago</span>
        {!isLoading && status && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${status.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {status.connected ? 'Conectado' : 'No conectado'}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="h-10 bg-sand rounded-lg animate-pulse" />
        ) : status?.connected ? (
          <>
            <p className="text-sm text-espresso">
              Los pagos online se acreditan en la cuenta de Mercado Pago <span className="font-bold">{status.mpUserId}</span>.
            </p>
            <button
              type="button"
              onClick={() => authorize.mutate()}
              disabled={authorize.isPending}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-sand-deep text-brown disabled:opacity-40 hover:border-terra hover:text-terra transition-colors"
            >
              Reconectar / cambiar cuenta
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Sin conectar. El checkout con Mercado Pago no va a funcionar hasta que conectes la cuenta que va a recibir los pagos.
            </p>
            <button
              type="button"
              onClick={() => authorize.mutate()}
              disabled={authorize.isPending}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-terra text-white disabled:opacity-40 hover:bg-terra-dark transition-colors"
            >
              <span className="icon text-[16px]">link</span>
              {authorize.isPending ? 'Conectando...' : 'Conectar Mercado Pago'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
