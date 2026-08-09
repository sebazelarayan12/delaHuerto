import { useQuery } from '@tanstack/react-query'
import { deliveryDiasApi } from '../../api/deliveryDias'

const DEFAULT_DIAS: boolean[] = [true, true, true, true, true, true, false]

export function useDeliveryDias() {
  const query = useQuery({
    queryKey: ['delivery-dias'],
    queryFn: deliveryDiasApi.get,
  })

  return { dias: query.data ?? DEFAULT_DIAS, isLoading: query.isLoading }
}
