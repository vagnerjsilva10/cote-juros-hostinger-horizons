import { trackEvent } from '@/platform/services/trackingAdapter.js';

const DEFAULT_WHATSAPP_NUMBER = '5511999999999';

export const buildWhatsAppUrl = ({ phoneNumber, message }) => {
  const number = String(phoneNumber || import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');
  const text = encodeURIComponent(message || 'Olá, fiz uma análise na Cote Juros e quero ver minhas opções.');
  return `https://wa.me/${number || DEFAULT_WHATSAPP_NUMBER}?text=${text}`;
};

export const openWhatsApp = async ({ phoneNumber, message, profile, mainProduct, sourcePage = 'smart_quiz' } = {}) => {
  const resolvedMessage =
    message ||
    `Olá, fiz uma análise na Cote Juros. Meu perfil foi classificado como ${profile || 'em análise'}, ` +
      `com recomendação para ${mainProduct || 'opções financeiras'}. Quero ver minhas opções.`;
  const url = buildWhatsAppUrl({ phoneNumber, message: resolvedMessage });

  await trackEvent('whatsapp_opened', {
    sourcePage,
    profile,
    mainProduct
  });

  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
};
