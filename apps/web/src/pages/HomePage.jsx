import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FileQuestion,
  Gauge,
  HandCoins,
  Landmark,
  Layers3,
  Mail,
  Newspaper,
  PiggyBank,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards
} from 'lucide-react';
import { toast } from 'sonner';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import {
  formatCurrencyValue,
  formatPhoneValue,
  parseCurrencyValue,
  submitQuickCreditApplication
} from '@/lib/quickCreditSubmission.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { brandPages, createOrganizationSchema, createWebSiteSchema } from '@/seo/brandSeo.js';
import { useSiteDisclaimers, disclaimerText } from '@/hooks/useSiteDisclaimers.js';
import { usePageContent } from '@/hooks/useSiteSettings.js';

const CONSENT_TEXT =
  'Autorizo a Cote Juros a usar meus dados para montar meu perfil e contato sobre opções de crédito. Sei que a Cote Juros não é banco, não garante aprovação e não cobra valor antecipado.';

const NOT_BANK_TEXT =
  'As opÃ§Ãµes variam conforme perfil e disponibilidade dos parceiros. A Cote Juros nÃ£o Ã© banco, nÃ£o garante aprovaÃ§Ã£o e nÃ£o cobra valor antecipado.';

const profileSteps = [
  {
    id: 'amount',
    label: 'Qual valor você procura?',
    helper: 'Use uma estimativa. Ela ajuda a organizar caminhos possíveis.',
    type: 'currency',
    placeholder: 'R$ 10.000,00'
  },
  {
    id: 'income',
    label: 'Qual sua renda mensal?',
    helper: 'A renda aproximada ajuda a avaliar o peso da parcela.',
    type: 'currency',
    placeholder: 'R$ 5.000,00'
  },
  {
    id: 'hasRestriction',
    label: 'Seu nome está negativado?',
    helper: 'Essa resposta muda a leitura inicial do perfil.',
    options: [
      { label: 'Não', value: false },
      { label: 'Sim', value: true },
      { label: 'Não sei', value: 'unknown' }
    ]
  },
  {
    id: 'employmentStatus',
    label: 'Qual sua ocupação?',
    helper: 'Perfis diferentes podem pedir caminhos diferentes.',
    options: [
      { label: 'CLT', value: 'CLT' },
      { label: 'Autônomo', value: 'Autonomo' },
      { label: 'MEI', value: 'Autonomo' },
      { label: 'Aposentado/pensionista', value: 'Aposentado' },
      { label: 'Empresário', value: 'Empresario' },
      { label: 'Desempregado', value: 'Desempregado' }
    ]
  },
  {
    id: 'goal',
    label: 'Qual é o objetivo?',
    helper: 'O objetivo ajuda a separar urgência, organização e comparação.',
    options: [
      { label: 'Pagar dívidas', value: 'debt' },
      { label: 'Organizar contas', value: 'organize' },
      { label: 'Emergência', value: 'emergency' },
      { label: 'Comprar algo', value: 'purchase' },
      { label: 'Investir no negócio', value: 'business' },
      { label: 'Outro', value: 'other' }
    ]
  }
];

const contactFields = [
  { id: 'fullName', label: 'Nome', placeholder: 'Como podemos te chamar?', inputMode: 'text' },
  { id: 'phone', label: 'WhatsApp', placeholder: '(11) 99999-9999', inputMode: 'tel' },
  { id: 'email', label: 'E-mail', placeholder: 'voce@email.com', inputMode: 'email' }
];

const categoryCards = [
  { title: 'Empréstimos', text: 'Pessoal, garantia e alternativas por perfil.', href: '/emprestimos', icon: Landmark },
  { title: 'Cartões', text: 'Guias para limite, uso e comparação.', href: '/cartoes', icon: CreditCard },
  { title: 'Financiamentos', text: 'Critérios para veículo, imóvel e prazo.', href: '/financiamentos', icon: WalletCards },
  { title: 'Bancos', text: 'Contexto para comparar instituições.', href: '/ofertas', icon: Building2 },
  { title: 'Score de crédito', text: 'Entenda impacto, histórico e cuidados.', href: '/blog/score-de-credito-como-funciona', icon: Gauge },
  { title: 'Guias', text: 'Conteúdo para decidir sem pressa.', href: '/blog', icon: BookOpen }
];

const comparisonReasons = [
  {
    title: 'Sem cobrança antecipada',
    text: 'O comparador não pede taxa para tentar liberar crédito.',
    icon: ShieldCheck
  },
  {
    title: 'Comparação com clareza',
    text: 'A leitura separa valor, renda, objetivo e cuidados antes de seguir.',
    icon: Search
  },
  {
    title: 'Conteúdo para decidir',
    text: 'Guias ajudam a entender custo, parcela e riscos comuns.',
    icon: Newspaper
  },
  {
    title: 'Encaminhamento quando fizer sentido',
    text: 'O próximo passo depende do perfil, disponibilidade e análise.',
    icon: HandCoins
  }
];

const featuredProducts = [
  {
    title: 'Empréstimo pessoal',
    tag: 'Depende do perfil',
    text: 'Pode fazer sentido para necessidades pontuais, sempre sujeito à análise e custo total.',
    href: '/emprestimos',
    icon: Landmark
  },
  {
    title: 'Crédito com garantia',
    tag: 'Para valores maiores',
    text: 'Pode entrar na comparação quando prazo, risco e garantia forem avaliados com cuidado.',
    href: '/emprestimos',
    icon: Layers3
  },
  {
    title: 'Cartão de crédito',
    tag: 'Uso consciente',
    text: 'Pode ajudar no dia a dia, mas limite e parcelamento precisam caber no orçamento.',
    href: '/cartoes',
    icon: CreditCard
  },
  {
    title: 'Financiamento',
    tag: 'Prazo e entrada',
    text: 'Pode fazer sentido quando parcela, entrada e custo total são comparados com calma.',
    href: '/financiamentos',
    icon: WalletCards
  },
  {
    title: 'Organização financeira',
    tag: 'Antes de contratar',
    text: 'Pode ser o primeiro passo quando a melhor decisão é reorganizar compromissos.',
    href: '/diagnostico-financeiro',
    icon: PiggyBank
  }
];

const editorialRecommendations = [
  {
    title: 'Como comparar taxas antes de contratar',
    text: 'Taxa, CET, prazo e parcela precisam ser vistos juntos.',
    href: '/blog/como-comparar-taxas-de-juros'
  },
  {
    title: 'Como saber se uma parcela cabe no bolso',
    text: 'Compare o compromisso mensal com renda e margem para imprevistos.',
    href: '/simulador-comprometimento-renda'
  },
  {
    title: 'O que avaliar antes de pedir crédito',
    text: 'Objetivo, urgência e custo total mudam a decisão.',
    href: '/blog/como-saber-se-um-emprestimo-vale-a-pena'
  },
  {
    title: 'Como evitar cobrança antecipada',
    text: 'Promessa fácil e taxa para liberar crédito são sinais de alerta.',
    href: '/blog/emprestimo-online-seguro'
  }
];

const suggestedContents = [
  {
    label: 'Guia',
    title: 'Empréstimo para negativado: como avaliar',
    text: 'Veja cuidados importantes antes de seguir.',
    href: '/emprestimo-para-negativado'
  },
  {
    label: 'Ferramenta',
    title: 'Calculadora de CET',
    text: 'Estime o custo efetivo total de uma proposta.',
    href: '/calculadora-cet'
  },
  {
    label: 'Artigo',
    title: 'Como aumentar score de crédito',
    text: 'Entenda fatores que podem influenciar seu histórico.',
    href: '/blog/como-aumentar-score-de-credito'
  },
  {
    label: 'Diagnóstico',
    title: 'Organização financeira antes do crédito',
    text: 'Faça uma leitura simples do seu momento.',
    href: '/diagnostico-financeiro'
  }
];

const faqItems = [
  {
    question: 'A Cote Juros é banco?',
    answer: 'Não. A Cote Juros é um portal de comparação, conteúdo e encaminhamento. A análise formal e as condições finais dependem das instituições ou empresas responsáveis.'
  },
  {
    question: 'A Cote Juros cobra antecipado?',
    answer: 'Não cobramos valor antecipado para liberar crédito, aprovar proposta ou destravar qualquer oferta.'
  },
  {
    question: 'A análise garante aprovação?',
    answer: 'Não. O quiz organiza seu perfil para comparação. Aprovação, limite, taxa, prazo e disponibilidade sempre dependem dos critérios de terceiros.'
  },
  {
    question: 'O que acontece depois do quiz?',
    answer: 'Você vê uma leitura inicial do perfil e pode seguir para a próxima etapa quando fizer sentido. Os dados informados são reaproveitados para evitar repetição.'
  },
  {
    question: 'Meus dados são usados como?',
    answer: 'Os dados são usados para montar seu perfil, contato e continuidade do fluxo, conforme o consentimento registrado e a política de privacidade.'
  }
];

const homeIconMap = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  building: Building2,
  card: CreditCard,
  creditCard: CreditCard,
  gauge: Gauge,
  handCoins: HandCoins,
  landmark: Landmark,
  layers: Layers3,
  mail: Mail,
  piggyBank: PiggyBank,
  search: Search,
  shield: ShieldCheck,
  user: UserRound,
  wallet: WalletCards,
  newspaper: Newspaper
};

const resolveHomeIcon = (icon, fallback = Landmark) => {
  if (typeof icon === 'function') return icon;
  return homeIconMap[String(icon || '').trim()] || fallback;
};

const DEFAULT_HOME_CONTENT = {
  hero: {
    eyebrow: 'Comparador de credito',
    title: 'Veja caminhos de credito para o seu perfil',
    subtitle: 'Responda um quiz rapido, registre seu consentimento e compare opcoes com base no seu perfil. Sem cobranca antecipada e sem promessa de aprovacao.',
    bullets: ['Nao somos banco', 'Sem cobranca antecipada', 'Sem promessa falsa'],
    primaryCta: { label: 'Ver minhas opcoes', trackingLabel: 'Ver minhas opcoes hero' },
    secondaryCta: { label: 'Entender como funciona', href: '#como-funciona' }
  },
  categories: categoryCards,
  howItWorks: {
    eyebrow: 'Como funciona',
    title: 'Um perfil inicial que vira comparacao, nao so formulario.',
    subtitle: 'O quiz coleta o essencial, registra consentimento e organiza uma leitura para voce entender caminhos possiveis antes de avancar. Sem cobranca antecipada e sem promessa de aprovacao.',
    steps: [
      { title: 'Perfil', text: 'Valor, renda, restricao, ocupacao e objetivo entram primeiro.', icon: 'user' },
      { title: 'Contato', text: 'Nome, WhatsApp e e-mail ajudam a seguir sem repetir dados.', icon: 'mail' },
      { title: 'Consentimento', text: 'Voce autoriza o uso dos dados e entende os limites da analise.', icon: 'shield' }
    ],
    panelTitle: 'Analise inicial',
    panelMeta: '3 etapas',
    flow: ['Perfil', 'Criterios', 'Caminhos'],
    scoreTitle: 'Leitura organizada',
    scoreText: 'O resultado depende de perfil, analise e disponibilidade.',
    metrics: [
      { label: 'Reaproveitamento', value: 'Dados do quiz' },
      { label: 'Seguranca', value: 'Sem taxa antecipada' }
    ]
  },
  reasons: {
    eyebrow: 'Por que comparar na Cote Juros',
    title: 'Um hub para decidir com mais contexto',
    subtitle: 'Comparar nao e so clicar em uma oferta. E entender perfil, custo, objetivo e proximo passo.',
    items: comparisonReasons
  },
  difference: {
    eyebrow: 'Por que isso e diferente',
    title: 'Menos promessa. Mais clareza para decidir.',
    subtitle: 'A Cote Juros nao tenta parecer banco nem vender aprovacao garantida. A experiencia comeca por uma leitura simples do seu perfil e so avanca quando ha consentimento claro.',
    items: [
      { title: 'Voce nao preenche tudo de novo', text: 'Os dados do quiz sao reaproveitados na proxima etapa.' },
      { title: 'A analise comeca pelo seu perfil', text: 'Valor, renda e objetivo vem antes de qualquer oferta.' },
      { title: 'Sem cobranca antecipada', text: 'Voce nao paga taxa para tentar liberar credito.' },
      { title: 'Voce decide com calma', text: 'A leitura inicial nao obriga contratacao.' }
    ]
  },
  featured: {
    eyebrow: 'Produtos e caminhos em destaque',
    title: 'O proximo passo depende do seu perfil',
    subtitle: 'As opcoes abaixo sao caminhos possiveis de comparacao. Nenhuma delas representa aprovacao garantida.',
    items: featuredProducts,
    linkLabel: 'Comparar caminho'
  },
  midCta: {
    eyebrow: 'Comece pelo quiz',
    title: 'Use o quiz como porta de entrada do comparador.',
    subtitle: 'Voce informa o basico uma vez e continua apenas se fizer sentido.',
    cta: { label: 'Ver minhas opcoes', trackingLabel: 'Ver minhas opcoes intermediario' }
  },
  editorial: {
    eyebrow: 'Nossos guias recomendam',
    title: 'Conteudo para comparar antes de contratar',
    subtitle: 'Guias diretos para entender custo, parcela e sinais de alerta.',
    items: editorialRecommendations,
    linkLabel: 'Ler guia'
  },
  suggested: {
    eyebrow: 'Conteudos sugeridos',
    title: 'Continue explorando o hub Cote Juros',
    subtitle: 'Artigos e ferramentas para apoiar sua decisao sem inventar taxa ou promessa.',
    items: suggestedContents,
    linkLabel: 'Ver conteudo'
  },
  faq: {
    eyebrow: 'Perguntas frequentes',
    title: 'Duvidas comuns antes de seguir',
    subtitle: 'Respostas diretas para manter a comparacao transparente.',
    items: faqItems
  },
  finalCta: {
    title: 'Comece por uma comparacao simples',
    subtitle: 'Informe seu perfil, registre o consentimento e siga apenas se fizer sentido para voce.',
    cta: { label: 'Ver minhas opcoes', trackingLabel: 'Ver minhas opcoes final' }
  }
};

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function getStepValueLabel(step, value) {
  if (step.type === 'currency') return value ? formatCurrencyValue(value) : '';
  return step.options?.find((option) => option.value === value)?.label || '';
}

function normalizeLeadData(profile, contact, consentAcceptedAt, consentText = CONSENT_TEXT) {
  return {
    amount: parseCurrencyValue(profile.amount),
    income: parseCurrencyValue(profile.income),
    hasRestriction: profile.hasRestriction === true,
    employmentStatus: profile.employmentStatus,
    goal: profile.goal,
    fullName: contact.fullName.trim(),
    phone: contact.phone.replace(/\D/g, ''),
    email: contact.email.trim(),
    consentAccepted: true,
    consentText,
    consentAcceptedAt
  };
}

function buildResults(profile) {
  const results = [];
  const amount = parseCurrencyValue(profile.amount);
  const income = parseCurrencyValue(profile.income);

  if (profile.hasRestriction === true || profile.hasRestriction === 'unknown') {
    results.push({
      label: 'Cautela',
      title: 'Análise mais cuidadosa',
      text: 'Com restrição ou dúvida sobre o CPF, evite promessa de aprovação e cobrança antecipada.'
    });
  }

  if (amount >= 15000) {
    results.push({
      label: 'Possível caminho',
      title: 'Garantia pode entrar na comparação',
      text: 'Para valores maiores, prazo, garantia e custo total precisam ser avaliados com calma.'
    });
  }

  if (profile.goal === 'debt' || profile.goal === 'organize') {
    results.push({
      label: 'Organização',
      title: 'Parcela realista vem antes da pressa',
      text: 'O objetivo é evitar trocar uma dívida por outra com custo pior.'
    });
  }

  if (income && amount / income > 4) {
    results.push({
      label: 'Atenção',
      title: 'Valor alto em relação à renda',
      text: 'A análise deve priorizar impacto mensal e margem para imprevistos.'
    });
  }

  results.push({
    label: 'Base',
    title: 'Crédito pessoal pode ser avaliado',
    text: 'A disponibilidade depende de análise, renda, histórico e critérios dos parceiros.'
  });

  return results.slice(0, 3);
}

function HomeQuiz({ onFallback }) {
  const navigate = useNavigate();
  const homeDisclaimers = useSiteDisclaimers('home', [
    { key: 'lgpd_consent', content: CONSENT_TEXT },
    { key: 'not_bank', content: NOT_BANK_TEXT }
  ]);
  const consentText = disclaimerText(homeDisclaimers, 'lgpd_consent', CONSENT_TEXT);
  const notBankText = disclaimerText(homeDisclaimers, 'not_bank', NOT_BANK_TEXT);
  const [stage, setStage] = useState('profile');
  const [profileIndex, setProfileIndex] = useState(0);
  const [profile, setProfile] = useState({
    amount: '',
    income: '',
    hasRestriction: '',
    employmentStatus: '',
    goal: ''
  });
  const [contact, setContact] = useState({ fullName: '', phone: '', email: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const step = profileSteps[profileIndex];
  const results = useMemo(() => buildResults(profile), [profile]);
  const stageOrder = ['profile', 'contact', 'consent', 'analyzing', 'result'];
  const activeStageIndex = Math.max(0, stageOrder.indexOf(stage));
  const progress =
    stage === 'profile'
      ? Math.round(((profileIndex + 1) / profileSteps.length) * 44)
      : stage === 'contact'
        ? 60
        : stage === 'consent'
          ? 76
          : stage === 'analyzing'
            ? 88
            : 100;

  useEffect(() => {
    if (stage !== 'analyzing') return undefined;
    const timeoutId = window.setTimeout(() => setStage('result'), 900);
    return () => window.clearTimeout(timeoutId);
  }, [stage]);

  const currentLeadData = () => normalizeLeadData(profile, contact, consentAcceptedAt || new Date().toISOString(), consentText);

  const updateProfileValue = (value) => {
    setProfile((current) => ({ ...current, [step.id]: value }));
  };

  const goNextProfile = () => {
    if (step.type === 'currency' && parseCurrencyValue(profile[step.id]) < 1000) {
      toast.error('Informe um valor de pelo menos R$ 1.000,00.');
      return;
    }
    if (!step.type && profile[step.id] === '') {
      toast.error('Escolha uma opção para continuar.');
      return;
    }
    if (profileIndex < profileSteps.length - 1) {
      setProfileIndex((current) => current + 1);
      return;
    }
    setStage('contact');
  };

  const goBack = () => {
    if (stage === 'profile') {
      setProfileIndex((current) => Math.max(0, current - 1));
      return;
    }
    if (stage === 'contact') {
      setStage('profile');
      setProfileIndex(profileSteps.length - 1);
      return;
    }
    if (stage === 'consent') {
      setStage('contact');
      return;
    }
    if (stage === 'result') setStage('consent');
  };

  const submitContact = () => {
    if (contact.fullName.trim().length < 3) {
      toast.error('Informe seu nome para continuar.');
      return;
    }
    if (contact.phone.replace(/\D/g, '').length < 10) {
      toast.error('Informe um WhatsApp válido.');
      return;
    }
    if (!isValidEmail(contact.email)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    setStage('consent');
  };

  const submitConsent = () => {
    if (!consentAccepted) {
      toast.error('Aceite o consentimento para continuar.');
      return;
    }
    setConsentAcceptedAt(new Date().toISOString());
    setStage('analyzing');
  };

  const continueAnalysis = async () => {
    const leadData = currentLeadData();
    try {
      setIsSubmitting(true);
      const leadResult = await submitQuickCreditApplication({
        leadData,
        sourcePage: '/',
        originLabel: 'home_quiz',
        ctaLabel: 'Continuar para comparar'
      });
      navigate('/resultado', { state: { leadResult } });
    } catch (error) {
      onFallback(leadData);
      toast.error(error.message || 'Abrimos uma revisão rápida com seus dados preenchidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="hero-credit-preview" className="cj-quiz-card">
      <div className="cj-quiz-top">
        <div>
          <h2 className="cj-quiz-title">{stage === 'result' ? 'Caminhos iniciais' : 'Perfil rapido'}</h2>
          <p className="cj-quiz-note">
            {stage === 'result'
              ? 'Use como ponto de partida. Você ainda decide se faz sentido seguir.'
              : 'Perfil, contato e consentimento em um fluxo simples.'}
          </p>
        </div>
        <div className="cj-step-badge">{activeStageIndex + 1}/5</div>
      </div>

      <div className="cj-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {stage === 'profile' && (
        <>
          <div className="cj-field-label">{step.label}</div>
          <p className="cj-quiz-note cj-step-helper">{step.helper}</p>

          {step.type === 'currency' ? (
            <input
              className="cj-input-large"
              value={profile[step.id]}
              onChange={(event) => updateProfileValue(formatCurrencyValue(event.target.value))}
              placeholder={step.placeholder}
              inputMode="numeric"
            />
          ) : (
            <div className="cj-options">
              {step.options.map((option) => (
                <button
                  key={`${step.id}-${option.label}`}
                  type="button"
                  className={`cj-option ${profile[step.id] === option.value ? 'is-selected' : ''}`}
                  onClick={() => updateProfileValue(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <div className="cj-quiz-footer">
            <button type="button" className="cj-back" onClick={goBack} disabled={profileIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <button type="button" className="cj-btn cj-btn-primary" onClick={goNextProfile}>
              {profileIndex === profileSteps.length - 1 ? 'Ir para contato' : 'Continuar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {stage === 'contact' && (
        <>
          <div className="cj-field-label">Para onde enviamos o próximo passo?</div>
          <p className="cj-quiz-note cj-step-helper">Os dados do perfil serão reaproveitados na continuidade.</p>

          <div className="cj-contact-grid">
            {contactFields.map((field) => (
              <label key={field.id} className="cj-field">
                <span>{field.label}</span>
                <input
                  value={contact[field.id]}
                  onChange={(event) => {
                    const value = field.id === 'phone' ? formatPhoneValue(event.target.value) : event.target.value;
                    setContact((current) => ({ ...current, [field.id]: value }));
                  }}
                  placeholder={field.placeholder}
                  inputMode={field.inputMode}
                />
              </label>
            ))}
          </div>

          <div className="cj-quiz-footer">
            <button type="button" className="cj-back" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <button type="button" className="cj-btn cj-btn-primary" onClick={submitContact}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {stage === 'consent' && (
        <>
          <div className="cj-field-label">Confirme para seguir com a comparação</div>
          <p className="cj-quiz-note cj-step-helper">A autorização registra o uso dos dados neste fluxo.</p>

          <label className={`cj-consent-box ${consentAccepted ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
            />
            <span>{consentText}</span>
          </label>

          <div className="cj-quiz-footer">
            <button type="button" className="cj-back" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <button type="button" className="cj-btn cj-btn-primary" onClick={submitConsent}>
              Comparar caminhos
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {stage === 'analyzing' && (
        <div className="cj-analysis-state">
          <ShieldCheck className="h-7 w-7" />
          <strong>Organizando caminhos possíveis...</strong>
          <span>Organizando valor, renda, perfil, objetivo e consentimento.</span>
        </div>
      )}

      {stage === 'result' && (
        <>
          <div className="cj-answer-summary" aria-label="Resumo das respostas">
            <span>{formatCurrencyValue(profile.amount)}</span>
            <span>{formatCurrencyValue(profile.income)}</span>
            <span>{getStepValueLabel(profileSteps[2], profile.hasRestriction)}</span>
            <span>{getStepValueLabel(profileSteps[4], profile.goal)}</span>
          </div>

          <div className="cj-result-stack">
            {results.map((item) => (
              <div key={item.title} className="cj-result-card">
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <p className="cj-quiz-disclaimer">{notBankText}</p>

          <div className="cj-quiz-footer">
            <button type="button" className="cj-back" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
              Revisar
            </button>
            <button type="button" className="cj-btn cj-btn-primary" disabled={isSubmitting} onClick={continueAnalysis}>
              {isSubmitting ? 'Continuando...' : 'Continuar para comparar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const content = usePageContent('home', DEFAULT_HOME_CONTENT);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLeadData, setModalLeadData] = useState(null);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const focusQuiz = (ctaLabel = 'Comecar comparacao') => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_focus_quiz_cta',
      ctaLabel,
      productType: 'loan'
    });

    document.getElementById('hero-credit-preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const openGenericResults = (ctaLabel = 'Ver minhas opcoes') => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_generic_results_cta',
      ctaLabel,
      productType: 'loan',
      metadata: {
        fallbackProfile: {
          negativado: null,
          renda: null,
          valor: null,
          urgencia: null
        }
      }
    });

    navigate('/resultado');
  };

  const openFallbackModal = (leadData) => {
    setModalLeadData(leadData);
    setModalOpen(true);
  };

  return (
    <>
      <SeoHead
        title={brandPages.home.title}
        description={brandPages.home.description}
        path={brandPages.home.path}
        structuredData={[createOrganizationSchema(), createWebSiteSchema()]}
      >
        <meta name="verify-admitad" content="1ae3db0be4" />
      </SeoHead>

      <QuickCreditFlowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourcePage="/"
        originLabel="home_quiz_fallback"
        initialData={modalLeadData}
      />

      <main className="cj-home">
        <section id="home-hero" className="cj-hero">
          <div className="cj-wrap cj-hero-grid">
            <div>
              <span className="cj-eyebrow">{content.hero.eyebrow}</span>
              <h1>{content.hero.title}</h1>
              <p>{content.hero.subtitle}</p>

              <div className="cj-bullets" aria-label="Pontos de transparencia">
                {(content.hero.bullets || []).map((item) => (
                  <span key={item} className="cj-pill">
                    <CheckCircle2 className="h-4 w-4" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="cj-actions">
                <button type="button" className="cj-btn cj-btn-primary" onClick={() => openGenericResults(content.hero.primaryCta?.trackingLabel || content.hero.primaryCta?.label)}>
                  {content.hero.primaryCta?.label}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a className="cj-btn cj-btn-secondary" href={content.hero.secondaryCta?.href || '#como-funciona'}>
                  {content.hero.secondaryCta?.label}
                </a>
              </div>
            </div>
            <HomeQuiz onFallback={openFallbackModal} />
          </div>
        </section>

        <section className="cj-category-band" aria-label="Categorias para comparar">
          <div className="cj-wrap">
            <div className="cj-category-grid">
              {(content.categories || []).map((item) => {
                const Icon = resolveHomeIcon(item.icon, Landmark);
                return (
                  <Link key={item.title} to={item.href} className="cj-category-card">
                    <span className="cj-icon-chip">
                      <Icon className="h-5 w-5" />
                    </span>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="cj-section cj-section-white">
          <div className="cj-wrap">
            <div className="cj-how-grid">
              <div>
                <span className="cj-eyebrow">Como funciona</span>
                <h2>Um perfil inicial que vira comparação, não só formulário.</h2>
                <p>
                  O quiz coleta o essencial, registra consentimento e organiza uma leitura para você entender caminhos
                  possíveis antes de avançar. Sem cobrança antecipada e sem promessa de aprovação.
                </p>
                <div className="cj-how-list">
                  {[
                    ['Perfil', 'Valor, renda, restrição, ocupação e objetivo entram primeiro.', UserRound],
                    ['Contato', 'Nome, WhatsApp e e-mail ajudam a seguir sem repetir dados.', Mail],
                    ['Consentimento', 'Você autoriza o uso dos dados e entende os limites da análise.', ShieldCheck]
                  ].map(([title, text, Icon]) => (
                    <article key={title} className="cj-how-step">
                      <Icon className="h-5 w-5" />
                      <div>
                        <strong>{title}</strong>
                        <span>{text}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="cj-how-panel" aria-label="Painel visual da comparação">
                <div className="cj-panel-header">
                  <span>Análise inicial</span>
                  <strong>3 etapas</strong>
                </div>
                <div className="cj-flow-line">
                  <span>Perfil</span>
                  <span>Critérios</span>
                  <span>Caminhos</span>
                </div>
                <div className="cj-score-card">
                  <ClipboardCheck className="h-6 w-6" />
                  <div>
                    <strong>Leitura organizada</strong>
                    <p>O resultado depende de perfil, análise e disponibilidade.</p>
                  </div>
                </div>
                <div className="cj-panel-metrics">
                  <div>
                    <small>Reaproveitamento</small>
                    <strong>Dados do quiz</strong>
                  </div>
                  <div>
                    <small>Segurança</small>
                    <strong>Sem taxa antecipada</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-muted">
          <div className="cj-wrap">
            <div className="cj-section-head">
              <span className="cj-eyebrow">{content.reasons.eyebrow}</span>
              <h2>{content.reasons.title}</h2>
              <p>{content.reasons.subtitle}</p>
            </div>

            <div className="cj-reason-grid">
              {(content.reasons.items || []).map((item) => {
                const Icon = resolveHomeIcon(item.icon, ShieldCheck);
                return (
                  <article key={item.title} className="cj-reason-card">
                    <Icon className="h-6 w-6" />
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-white">
          <div className="cj-wrap">
            <div className="cj-split cj-compare-split">
              <div>
                <span className="cj-eyebrow">Por que isso é diferente</span>
                <h2>Menos promessa. Mais clareza para decidir.</h2>
                <p>
                  A Cote Juros não tenta parecer banco nem vender aprovação garantida. A experiência começa por uma
                  leitura simples do seu perfil e só avança quando há consentimento claro.
                </p>
              </div>

              <div className="cj-panel-list">
                {[
                  ['Você não preenche tudo de novo', 'Os dados do quiz são reaproveitados na próxima etapa.'],
                  ['A análise começa pelo seu perfil', 'Valor, renda e objetivo vêm antes de qualquer oferta.'],
                  ['Sem cobrança antecipada', 'Você não paga taxa para tentar liberar crédito.'],
                  ['Você decide com calma', 'A leitura inicial não obriga contratação.']
                ].map(([title, text]) => (
                  <div key={title} className="cj-panel-item">
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-muted">
          <div className="cj-wrap">
            <div className="cj-section-head">
              <span className="cj-eyebrow">{content.featured.eyebrow}</span>
              <h2>{content.featured.title}</h2>
              <p>{content.featured.subtitle}</p>
            </div>

            <div className="cj-featured-grid">
              {(content.featured.items || []).map((item) => {
                const Icon = resolveHomeIcon(item.icon, Landmark);
                return (
                  <Link key={item.title} to={item.href} className="cj-featured-card">
                    <div className="cj-featured-top">
                      <Icon className="h-6 w-6" />
                      <span>{item.tag}</span>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                    <small>
                      {content.featured.linkLabel}
                      <ArrowRight className="h-4 w-4" />
                    </small>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cj-mid-cta">
          <div className="cj-wrap">
            <div className="cj-mid-cta-box">
              <div>
                <span className="cj-eyebrow">Comece pelo quiz</span>
                <h2>Use o quiz como porta de entrada do comparador.</h2>
                <p>Você informa o básico uma vez e continua apenas se fizer sentido.</p>
              </div>
              <button type="button" className="cj-btn cj-btn-primary" onClick={() => openGenericResults('Ver minhas opcoes intermediario')}>
                Ver minhas opções
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-white">
          <div className="cj-wrap">
            <div className="cj-section-head">
              <span className="cj-eyebrow">Nossos guias recomendam</span>
              <h2>Conteúdo para comparar antes de contratar</h2>
              <p>Guias diretos para entender custo, parcela e sinais de alerta.</p>
            </div>

            <div className="cj-editorial-grid">
              {editorialRecommendations.map((item, index) => (
                <Link key={item.title} to={item.href} className={`cj-editorial-card cj-editorial-card-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                  <small>
                    Ler guia
                    <ArrowRight className="h-4 w-4" />
                  </small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-muted">
          <div className="cj-wrap">
            <div className="cj-section-head">
              <span className="cj-eyebrow">Conteúdos sugeridos</span>
              <h2>Continue explorando o hub Cote Juros</h2>
              <p>Artigos e ferramentas para apoiar sua decisão sem inventar taxa ou promessa.</p>
            </div>

            <div className="cj-content-grid">
              {suggestedContents.map((item) => (
                <Link key={item.title} to={item.href} className="cj-content-card">
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                  <small>Ver conteúdo</small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="cj-section cj-section-white">
          <div className="cj-wrap">
            <div className="cj-faq-layout">
              <div>
                <span className="cj-eyebrow">{content.faq.eyebrow}</span>
                <h2>{content.faq.title}</h2>
                <p>{content.faq.subtitle}</p>
              </div>
              <div className="cj-faq-list">
                {(content.faq.items || []).map((item) => (
                  <details key={item.question} className="cj-faq-item">
                    <summary>
                      {item.question}
                      <FileQuestion className="h-5 w-5" />
                    </summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="final-cta" className="cj-final">
          <div className="cj-wrap">
            <div className="cj-final-box">
              <BriefcaseBusiness className="mx-auto h-7 w-7 text-[var(--cj-primary)]" />
              <h2>{content.finalCta.title}</h2>
              <p>{content.finalCta.subtitle}</p>
              <button type="button" className="cj-btn cj-btn-primary" onClick={() => openGenericResults(content.finalCta.cta?.trackingLabel || content.finalCta.cta?.label)}>
                {content.finalCta.cta?.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default HomePage;
