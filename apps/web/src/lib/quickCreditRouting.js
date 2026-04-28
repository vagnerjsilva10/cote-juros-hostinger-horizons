const PARTNER_CONFIG = {
  negativado: {
    id: 'supersim',
    name: 'SuperSim',
    mode: 'tracking_link',
    destinationUrl: 'https://susim.co/XQLX5t8rSqYxaWnPd7CQaw==',
    description: 'Opcao de emprestimo pessoal online para comparar condicoes conforme seu perfil.',
    highlights: ['Perfil com restricao pode ser considerado', 'Fluxo online', 'Condicoes sujeitas ao parceiro'],
    ctaText: 'Ver condicoes',
    eventType: 'click_partner_supersim'
  },
  clt: {
    id: 'partner_clt',
    name: 'Banco Parceiro Credito',
    mode: 'tracking_link',
    destinationUrl: 'https://www.awin1.com/cread.php?awinmid=00000&awinaffid=000000&ued=https%3A%2F%2Fwww.cotejuros.com.br%2Femprestimo-online'
  },
  autonomo: {
    id: 'partner_autonomo',
    name: 'Parceiro C',
    mode: 'mock_api',
    destinationUrl: ''
  },
  geral: {
    id: 'partner_geral',
    name: 'Banco Parceiro Credito',
    mode: 'tracking_link',
    destinationUrl: 'https://www.awin1.com/cread.php?awinmid=00000&awinaffid=000000&ued=https%3A%2F%2Fwww.cotejuros.com.br%2Femprestimo-online'
  }
};

export const calculateQuickCreditProfile = ({
  income = 0,
  hasRestriction = false,
  employmentStatus = ''
} = {}) => {
  if (hasRestriction) return 'negativado';
  if (employmentStatus === 'CLT' && Number(income || 0) >= 3000) return 'clt';
  if (employmentStatus === 'Autonomo') return 'autonomo';
  return 'geral';
};

export const resolveQuickCreditPartner = (profile = 'geral') => PARTNER_CONFIG[profile] || PARTNER_CONFIG.geral;

export const resolveQuickCreditRecommendations = ({ profile = 'geral', amount = 0, hasRestriction = false } = {}) => {
  const recommendations = [];
  const shouldIncludeSupersim = hasRestriction || Number(amount || 0) <= 20000;
  if (shouldIncludeSupersim) recommendations.push(PARTNER_CONFIG.negativado);
  const primary = PARTNER_CONFIG[profile] || PARTNER_CONFIG.geral;
  if (!recommendations.some((partner) => partner.id === primary.id)) recommendations.push(primary);
  return recommendations.filter(Boolean).slice(0, 4);
};
