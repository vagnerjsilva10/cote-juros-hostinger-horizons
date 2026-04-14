const PARTNER_CONFIG = {
  negativado: {
    id: 'partner_negativado',
    name: 'SuperSim',
    mode: 'tracking_link',
    destinationUrl: 'https://ad.admitad.com/g/supersim-placeholder/'
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

export class QuickCreditRoutingService {
  static calculateProfile({ income = 0, hasRestriction = false, employmentStatus = '' } = {}) {
    if (hasRestriction) return 'negativado';
    if (employmentStatus === 'CLT' && Number(income || 0) >= 3000) return 'clt';
    if (employmentStatus === 'Autonomo') return 'autonomo';
    return 'geral';
  }

  static resolvePartner(profile = 'geral') {
    return PARTNER_CONFIG[profile] || PARTNER_CONFIG.geral;
  }
}
