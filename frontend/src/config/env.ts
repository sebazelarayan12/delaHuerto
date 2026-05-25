export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string ?? 'http://localhost:3000',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER as string ?? '5491112345678',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY as string ?? '',
}
