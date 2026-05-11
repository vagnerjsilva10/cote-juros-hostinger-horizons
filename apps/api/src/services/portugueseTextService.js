const MOJIBAKE_PATTERN = /(?:\u00c3.|\u00c2.|\u00e2\u20ac\u2122|\u00e2\u20ac\u0153|\u00e2\u20ac|\ufffd)/;

const COMMON_ACCENT_MAP = new Map([
  ['abusivos', 'abusivos'],
  ['acessivel', 'acessível'],
  ['acessiveis', 'acessíveis'],
  ['aceitavel', 'aceitável'],
  ['aceitaveis', 'aceitáveis'],
  ['alem', 'além'],
  ['analise', 'análise'],
  ['analises', 'análises'],
  ['aprovacao', 'aprovação'],
  ['apos', 'após'],
  ['ate', 'até'],
  ['atencao', 'atenção'],
  ['alivio', 'alívio'],
  ['antecipacao', 'antecipação'],
  ['automatico', 'automático'],
  ['automaticos', 'automáticos'],
  ['autonomo', 'autônomo'],
  ['autonomos', 'autônomos'],
  ['basica', 'básica'],
  ['basicas', 'básicas'],
  ['basico', 'básico'],
  ['basicos', 'básicos'],
  ['binario', 'binário'],
  ['beneficio', 'benefício'],
  ['beneficios', 'benefícios'],
  ['cartao', 'cartão'],
  ['cartoes', 'cartões'],
  ['cenario', 'cenário'],
  ['cenarios', 'cenários'],
  ['codigo', 'código'],
  ['cartorio', 'cartório'],
  ['comeca', 'começa'],
  ['comecam', 'começam'],
  ['comparacao', 'comparação'],
  ['comparacoes', 'comparações'],
  ['comparavel', 'comparável'],
  ['comparaveis', 'comparáveis'],
  ['contratacao', 'contratação'],
  ['contratacoes', 'contratações'],
  ['cobranca', 'cobrança'],
  ['cobrancas', 'cobranças'],
  ['credito', 'crédito'],
  ['creditos', 'créditos'],
  ['decisao', 'decisão'],
  ['decisoes', 'decisões'],
  ['debito', 'débito'],
  ['debitos', 'débitos'],
  ['diagnostico', 'diagnóstico'],
  ['diferenca', 'diferença'],
  ['diferencas', 'diferenças'],
  ['definicao', 'definição'],
  ['definicoes', 'definições'],
  ['disponivel', 'disponível'],
  ['disponiveis', 'disponíveis'],
  ['divida', 'dívida'],
  ['dividas', 'dívidas'],
  ['educacao', 'educação'],
  ['emergencia', 'emergência'],
  ['emprestimo', 'empréstimo'],
  ['emprestimos', 'empréstimos'],
  ['entao', 'então'],
  ['endereco', 'endereço'],
  ['enderecos', 'endereços'],
  ['exigencia', 'exigência'],
  ['exigencias', 'exigências'],
  ['estrategia', 'estratégia'],
  ['estrategias', 'estratégias'],
  ['fatura', 'fatura'],
  ['facil', 'fácil'],
  ['familia', 'família'],
  ['financas', 'finanças'],
  ['historico', 'histórico'],
  ['historia', 'história'],
  ['historias', 'histórias'],
  ['imovel', 'imóvel'],
  ['imoveis', 'imóveis'],
  ['inadimplencia', 'inadimplência'],
  ['inicio', 'início'],
  ['instituicao', 'instituição'],
  ['instituicoes', 'instituições'],
  ['informacao', 'informação'],
  ['informacoes', 'informações'],
  ['ja', 'já'],
  ['juros', 'juros'],
  ['liquido', 'líquido'],
  ['liquidos', 'líquidos'],
  ['liberacao', 'liberação'],
  ['necessario', 'necessário'],
  ['necessaria', 'necessária'],
  ['maior', 'maior'],
  ['maquinas', 'máquinas'],
  ['medio', 'médio'],
  ['mes', 'mês'],
  ['minimo', 'mínimo'],
  ['minimos', 'mínimos'],
  ['nao', 'não'],
  ['numero', 'número'],
  ['numeros', 'números'],
  ['ninguem', 'ninguém'],
  ['obrigatorio', 'obrigatório'],
  ['obrigatoria', 'obrigatória'],
  ['opcao', 'opção'],
  ['opcoes', 'opções'],
  ['orcamento', 'orçamento'],
  ['operacao', 'operação'],
  ['operacoes', 'operações'],
  ['orgaos', 'órgãos'],
  ['opiniao', 'opinião'],
  ['opinioes', 'opiniões'],
  ['paragrafo', 'parágrafo'],
  ['paragrafos', 'parágrafos'],
  ['padrao', 'padrão'],
  ['padroes', 'padrões'],
  ['politica', 'política'],
  ['politicas', 'políticas'],
  ['posicao', 'posição'],
  ['posicoes', 'posições'],
  ['possivel', 'possível'],
  ['possiveis', 'possíveis'],
  ['pratica', 'prática'],
  ['praticas', 'práticas'],
  ['pratico', 'prático'],
  ['praticos', 'práticos'],
  ['prevencao', 'prevenção'],
  ['previo', 'prévio'],
  ['previa', 'prévia'],
  ['proximo', 'próximo'],
  ['proximos', 'próximos'],
  ['referencia', 'referência'],
  ['referencias', 'referências'],
  ['rapida', 'rápida'],
  ['rapido', 'rápido'],
  ['renegociacao', 'renegociação'],
  ['responsavel', 'responsável'],
  ['restricao', 'restrição'],
  ['restricoes', 'restrições'],
  ['revisao', 'revisão'],
  ['salario', 'salário'],
  ['salarios', 'salários'],
  ['seguranca', 'segurança'],
  ['sinonimo', 'sinônimo'],
  ['so', 'só'],
  ['simulacao', 'simulação'],
  ['simulacoes', 'simulações'],
  ['situacao', 'situação'],
  ['situacoes', 'situações'],
  ['solida', 'sólida'],
  ['tambem', 'também'],
  ['tecnica', 'técnica'],
  ['tecnicas', 'técnicas'],
  ['tecnico', 'técnico'],
  ['tecnicos', 'técnicos'],
  ['titulo', 'título'],
  ['titulos', 'títulos'],
  ['tres', 'três'],
  ['util', 'útil'],
  ['unico', 'único'],
  ['unica', 'única'],
  ['urgencia', 'urgência'],
  ['reputacao', 'reputação'],
  ['veiculo', 'veículo'],
  ['veiculos', 'veículos'],
  ['vinculo', 'vínculo'],
  ['vinculos', 'vínculos'],
  ['elegivel', 'elegível'],
  ['elegiveis', 'elegíveis'],
  ['voce', 'você']
]);

const SKIP_TEXT_KEYS = new Set([
  'id',
  'slug',
  'path',
  'routePath',
  'to',
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
  'usedImageRecordId',
  'factoryIdempotencyKey'
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
    .replace(/\bnão e\b/gi, 'não é')
    .replace(/\bNão e\b/g, 'Não é')
    .replace(/\baprovacao não e\b/gi, 'aprovação não é')
    .replace(/\baprovação não e\b/gi, 'aprovação não é')
    .replace(/\bA leitura da Cote Juros e\b/g, 'A leitura da Cote Juros é')
    .replace(/\bAqui a Cote Juros e\b/g, 'Aqui a Cote Juros é')
    .replace(/\bO erro comum e\b/g, 'O erro comum é')
    .replace(/\bA pergunta mais adulta e\b/g, 'A pergunta mais adulta é')
    .replace(/\bO sinal de alerta mais importante e\b/g, 'O sinal de alerta mais importante é')
    .replace(/\bOutro padrão perigoso e\b/g, 'Outro padrão perigoso é')
    .replace(/\bPressa também e\b/g, 'Pressa também é')
    .replace(/\bessa camada e importante\b/gi, 'essa camada é importante')
    .replace(/\ba pergunta não é apenas\b/gi, 'a pergunta não é apenas')
    .replace(/\ba proposta e golpe\b/gi, 'a proposta é golpe')
    .replace(/\ba operação e feita\b/gi, 'a operação é feita')
    .replace(/\bvalor e um alerta\b/gi, 'valor é um alerta')
    .replace(/\binformação incompleta e um custo\b/gi, 'informação incompleta é um custo')
    .replace(/\bo risco de piorar a situação e alto\b/gi, 'o risco de piorar a situação é alto')
    .replace(/\ba melhor decisão ainda e pausar\b/gi, 'a melhor decisão ainda é pausar')
    .replace(/\bela ainda não e\b/gi, 'ela ainda não é')
    .replace(/\bele não e\b/gi, 'ele não é')
    .replace(/\bela não e\b/gi, 'ela não é')
    .replace(/\bAs vezes ele e\b/g, 'Às vezes ele é')
    .replace(/\bÀs vezes ele e\b/g, 'Às vezes ele é')
    .replace(/\bquem esta\b/gi, 'quem está')
    .replace(/\bpessoa esta\b/gi, 'pessoa está')
    .replace(/\besta negativad/gi, 'está negativad')
    .replace(/\besta vendendo\b/gi, 'está vendendo')
    .replace(/\besta com\b/gi, 'está com')
    .replace(/\bvale a pena\s+vale a pena\?/gi, 'vale a pena?')
    .replace(/\bvale a pena\s+vale a pena\b/gi, 'vale a pena')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const normalizeTextForValidation = (value = '') => repairPortugueseText(value);

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
