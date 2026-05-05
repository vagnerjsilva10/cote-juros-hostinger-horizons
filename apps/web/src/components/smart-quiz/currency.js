const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const parseCurrencyBRL = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value || '').trim();
  if (!raw) return 0;

  const withoutCurrency = raw.replace(/[R$\s]/g, '');
  const hasDecimalComma = /,\d{1,2}$/.test(withoutCurrency);
  const normalized = hasDecimalComma
    ? withoutCurrency.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
    : withoutCurrency.replace(/\D/g, '');

  return normalized ? Number(normalized) : 0;
};

export const formatCurrencyBRL = (value) => {
  const amount = parseCurrencyBRL(value);
  if (!amount) return '';
  return currencyFormatter.format(amount);
};
