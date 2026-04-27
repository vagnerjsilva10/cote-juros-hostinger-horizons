const MOJIBAKE_PATTERN = /(?:\u00c3.|\u00c2.|\u00e2\u20ac\u2122|\u00e2\u20ac\u0153|\u00e2\u20ac|\ufffd)/;

const COMMON_ACCENT_MAP = new Map([
  ['abusivos', 'abusivos'],
  ['acessivel', 'acessível'],
  ['acessiveis', 'acessíveis'],
  ['analise', 'análise'],
  ['analises', 'análises'],
  ['aprovacao', 'aprovação'],
  ['apos', 'após'],
  ['ate', 'até'],
  ['atencao', 'atenção'],
  ['automatico', 'automático'],
  ['automaticos', 'automáticos'],
  ['autonomo', 'autônomo'],
  ['autonomos', 'autônomos'],
  ['basica', 'básica'],
  ['basicas', 'básicas'],
  ['basico', 'básico'],
  ['basicos', 'básicos'],
  ['cartao', 'cartão'],
  ['cartoes', 'cartões'],
  ['cenario', 'cenário'],
  ['cenarios', 'cenários'],
  ['codigo', 'código'],
  ['comparacao', 'comparação'],
  ['comparacoes', 'comparações'],
  ['contratacao', 'contratação'],
  ['contratacoes', 'contratações'],
  ['credito', 'crédito'],
  ['creditos', 'créditos'],
  ['decisao', 'decisão'],
  ['decisoes', 'decisões'],
  ['debito', 'débito'],
  ['debitos', 'débitos'],
  ['diagnostico', 'diagnóstico'],
  ['diferenca', 'diferença'],
  ['diferencas', 'diferenças'],
  ['divida', 'dívida'],
  ['dividas', 'dívidas'],
  ['educacao', 'educação'],
  ['emergencia', 'emergência'],
  ['emprestimo', 'empréstimo'],
  ['emprestimos', 'empréstimos'],
  ['entao', 'então'],
  ['fatura', 'fatura'],
  ['facil', 'fácil'],
  ['familia', 'família'],
  ['financas', 'finanças'],
  ['historico', 'histórico'],
  ['imovel', 'imóvel'],
  ['imoveis', 'imóveis'],
  ['inadimplencia', 'inadimplência'],
  ['inicio', 'início'],
  ['juros', 'juros'],
  ['maior', 'maior'],
  ['maquinas', 'máquinas'],
  ['medio', 'médio'],
  ['mes', 'mês'],
  ['minimo', 'mínimo'],
  ['minimos', 'mínimos'],
  ['nao', 'não'],
  ['numero', 'número'],
  ['numeros', 'números'],
  ['opcao', 'opção'],
  ['opcoes', 'opções'],
  ['orcamento', 'orçamento'],
  ['operacao', 'operação'],
  ['operacoes', 'operações'],
  ['paragrafo', 'parágrafo'],
  ['paragrafos', 'parágrafos'],
  ['possivel', 'possível'],
  ['possiveis', 'possíveis'],
  ['pratica', 'prática'],
  ['praticas', 'práticas'],
  ['pratico', 'prático'],
  ['praticos', 'práticos'],
  ['proximo', 'próximo'],
  ['proximos', 'próximos'],
  ['rapida', 'rápida'],
  ['rapido', 'rápido'],
  ['renegociacao', 'renegociação'],
  ['restricao', 'restrição'],
  ['restricoes', 'restrições'],
  ['revisao', 'revisão'],
  ['salario', 'salário'],
  ['salarios', 'salários'],
  ['seguranca', 'segurança'],
  ['simulacao', 'simulação'],
  ['simulacoes', 'simulações'],
  ['tecnica', 'técnica'],
  ['tecnicas', 'técnicas'],
  ['tecnico', 'técnico'],
  ['tecnicos', 'técnicos'],
  ['titulo', 'título'],
  ['titulos', 'títulos'],
  ['util', 'útil'],
  ['veiculo', 'veículo'],
  ['veiculos', 'veículos'],
  ['voce', 'você']
]);

const SKIP_TEXT_KEYS = new Set([
  'id',
  'slug',
  'path',
  'routePath',
  'canonicalUrl',
  'url',
  'sourceUrl',
  'originalUrl',
  'downloadUrl',
  'publicPath',
  'coverImage',
  'ogImage',
  'image',
  'imagePath',
  'imageUrl',
  'hash',
  'perceptualHash',
  'provider',
  'mediaId',
  'wordpressPostId',
  'usedImageRecordId'
]);

const matchCase = (source, target) => {
  if (!source) return target;
  if (source.toUpperCase() === source) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return `${target[0].toUpperCase()}${target.slice(1)}`;
  return target;
};

export const repairMojibake = (value = '') => {
  const text = String(value || '');
  if (!MOJIBAKE_PATTERN.test(text)) return text.normalize('NFC');

  const repaired = Buffer.from(text, 'latin1').toString('utf8');
  return repaired.includes('\ufffd') && !text.includes('\ufffd') ? text.normalize('NFC') : repaired.normalize('NFC');
};

export const restoreCommonPortugueseAccents = (value = '') => {
  let text = repairMojibake(value);
  for (const [plain, accented] of COMMON_ACCENT_MAP) {
    if (plain === accented) continue;
    text = text.replace(new RegExp(`\\b${plain}\\b`, 'gi'), (match) => matchCase(match, accented));
  }
  return text.normalize('NFC');
};

export const repairPortugueseText = (value = '') =>
  restoreCommonPortugueseAccents(value)
    .replace(/\bvale a pena\s+vale a pena\?/gi, 'vale a pena?')
    .replace(/\bvale a pena\s+vale a pena\b/gi, 'vale a pena')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const repairPortugueseInObject = (value, key = '') => {
  if (typeof value === 'string') {
    return SKIP_TEXT_KEYS.has(key) || /^https?:\/\//i.test(value) ? value : repairPortugueseText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairPortugueseInObject(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        repairPortugueseInObject(entryValue, entryKey)
      ])
    );
  }

  return value;
};

export const hasPortugueseEncodingIssue = (value = '') => {
  const text = String(value || '');
  if (!text) return false;
  if (MOJIBAKE_PATTERN.test(text)) return true;
  for (const [plain, accented] of COMMON_ACCENT_MAP) {
    if (plain === accented) continue;
    if (new RegExp(`\\b${plain}\\b`, 'i').test(text) && !new RegExp(`\\b${accented}\\b`, 'i').test(text)) {
      return true;
    }
  }
  return false;
};

export const findPortugueseEncodingIssues = (value, path = 'article') => {
  const issues = [];

  const visit = (current, currentPath, key = '') => {
    if (typeof current === 'string') {
      if (!SKIP_TEXT_KEYS.has(key) && hasPortugueseEncodingIssue(current)) {
        issues.push(currentPath);
      }
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}[${index}]`, key));
      return;
    }

    if (current && typeof current === 'object') {
      Object.entries(current).forEach(([entryKey, entryValue]) => {
        visit(entryValue, `${currentPath}.${entryKey}`, entryKey);
      });
    }
  };

  visit(value, path);
  return issues;
};
