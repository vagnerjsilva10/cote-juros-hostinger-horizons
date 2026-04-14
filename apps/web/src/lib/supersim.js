export const SUPERSIM_OFFER_SLUG = 'supersim-emprestimo-pessoal';
export const SUPERSIM_MERCHANT_NAME = 'supersim';

export const SUPERSIM_BADGES = [
  'Analise rapida',
  'Para negativado',
  'Sem garantia',
  'Online'
];

export const SUPERSIM_BENEFITS = [
  'Pedido 100% online com retorno rapido de analise.',
  'Opcao que costuma entrar no radar de quem busca credito mesmo com restricao.',
  'Fluxo simples para comparar valores, prazo e custo antes de sair do portal.'
];

export const SUPERSIM_TARGET_ARTICLE_PATHS = [
  '/emprestimo-para-negativado',
  '/bancos-digitais-para-credito-rapido',
  '/10-melhores-bancos-para-solicitar-emprestimo',
  '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos',
  '/emprestimos-para-mei'
];

export const isSupersimOffer = (offer = {}) => {
  const merchantName = String(offer?.merchantName || '').toLowerCase().trim();
  const offerSlug = String(offer?.offerSlug || '').toLowerCase().trim();

  return merchantName.includes(SUPERSIM_MERCHANT_NAME) || offerSlug === SUPERSIM_OFFER_SLUG;
};

export const getSupersimOffer = (offers = []) => offers.find((offer) => isSupersimOffer(offer)) || null;

export const getNonSupersimOffers = (offers = []) => offers.filter((offer) => !isSupersimOffer(offer));
