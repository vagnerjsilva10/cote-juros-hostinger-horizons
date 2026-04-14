export const PRODUCT_TYPE_LABELS = {
  loan: 'Empréstimo',
  credit_card: 'Cartão de crédito',
  financing: 'Financiamento',
  all: 'Todos'
};

export const RECORD_STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  all: 'Todos'
};

export const PUBLICATION_STATUS_LABELS = {
  draft: 'Rascunho',
  published: 'Publicado',
  unpublished: 'Despublicado',
  all: 'Todos'
};

export const LEAD_STATUS_LABELS = {
  new: 'Novo',
  qualified: 'Qualificado',
  sent: 'Enviado',
  converted: 'Convertido',
  archived: 'Arquivado',
  all: 'Todos'
};

export function getProductTypeLabel(value) {
  return PRODUCT_TYPE_LABELS[value] || value || '-';
}

export function getRecordStatusLabel(value) {
  return RECORD_STATUS_LABELS[value] || value || '-';
}

export function getPublicationStatusLabel(value) {
  return PUBLICATION_STATUS_LABELS[value] || value || '-';
}

export function getLeadStatusLabel(value) {
  return LEAD_STATUS_LABELS[value] || value || '-';
}
