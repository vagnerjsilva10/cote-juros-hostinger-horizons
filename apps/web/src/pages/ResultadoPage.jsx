import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, Car, ClipboardCheck, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import SeoHead from '@/components/SeoHead.jsx';
import { PlatformShell } from '@/platform/PlatformSite.jsx';
import { buildPartnerMatches, recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { getQuizProgress, saveQuizProgress } from '@/platform/services/quizAdapter.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { formatCurrencyBRL } from '@/components/smart-quiz/currency.js';

const CONSENT_VERSION = 'cj-funnel-v1';

const readLastAnalysis = () => {
  try {
    return JSON.parse(window.localStorage.getItem('cote_last_analysis') || 'null');
  } catch {
    return null;
  }
};

function ResultadoPage() {
  const location = useLocation();
  const stored = location.state || readLastAnalysis() || getQuizProgress() || {};
  const quizAnswers = stored.quizAnswers || {};
  const recommendation = stored.recommendation || recommendProducts(quizAnswers);
  const matches = useMemo(
    () => recommendation.partnerMatches || buildPartnerMatches(quizAnswers, recommendation),
    [quizAnswers, recommendation]
  );
  const [consents, setConsents] = useState({});
  const [status, setStatus] = useState('');
  const [redirectingPartnerId, setRedirectingPartnerId] = useState('');

  const guaranteeMatch = matches.find((match) => String(match.productType || '').includes('equity')) || matches[0];
  const personalMatch = matches.find((match) => match.partnerId === 'standard-credit-hub') || matches.find((match) => match !== guaranteeMatch);
  const resultCards = [
    {
      key: 'secured-credit',
      match: guaranteeMatch,
      Icon: Car,
      title: 'Crédito com garantia de veículo',
      badge: 'Boa possibilidade',
      description: 'Você informou possuir uma garantia, o que pode abrir caminho para opções de crédito com taxas mais competitivas.',
      compatibility: 'Compatibilidade estimada: 90%',
      cta: 'Consultar opção',
      note: 'A análise final pode exigir CPF, dados complementares e validação do parceiro.'
    },
    {
      key: 'personal-credit',
      match: personalMatch,
      Icon: CreditCard,
      title: 'Crédito pessoal',
      badge: 'Disponível para análise',
      description: 'Uma alternativa para comparar opções sem garantia, conforme seu perfil informado.',
      compatibility: 'Compatibilidade estimada: 82%',
      cta: 'Ver opção'
    }
  ].filter((card) => card.match);

  const summaryItems = [
    quizAnswers.monthlyIncome ? ['Renda informada', formatCurrencyBRL(quizAnswers.monthlyIncome)] : null,
    quizAnswers.requestedAmount ? ['Valor solicitado', formatCurrencyBRL(quizAnswers.requestedAmount)] : null
  ].filter(Boolean);

  useEffect(() => {
    trackEvent('result_viewed', {
      sourcePage: quizAnswers.sourcePage || stored.sourcePage || '/resultado',
      score: recommendation.score,
      profile: recommendation.profileLabel
    });
  }, [quizAnswers.sourcePage, recommendation.profileLabel, recommendation.score, stored.sourcePage]);

  const acceptConsent = async (partnerId) => {
    const consent = {
      accepted: true,
      consentVersion: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      partnerId
    };
    setConsents((current) => ({ ...current, [partnerId]: consent }));
    saveQuizProgress({
      quizAnswers: {
        ...quizAnswers,
        consentPartnerSharing: true,
        consentVersion: CONSENT_VERSION
      },
      partnerConsent: consent
    });
    await trackEvent('consent_accepted', {
      sourcePage: '/resultado',
      partnerId,
      consentVersion: CONSENT_VERSION
    });
  };

  const handlePartnerClick = async (match) => {
    await trackEvent('partner_clicked', {
      sourcePage: '/resultado',
      partnerId: match.partnerId,
      destination: match.actionType
    });

    if (match.actionType === 'complete_data') {
      setStatus('Para avançar, revise seus dados de contato no quiz e tente novamente.');
      return;
    }

    if (match.actionType === 'eligibility' && !consents[match.partnerId]?.accepted) {
      setStatus('Antes de consultar essa opção, confirme a autorização de compartilhamento de dados no card.');
      return;
    }

    if (match.actionType === 'eligibility') {
      setStatus('Consulta registrada. As condições finais dependem da análise do parceiro.');
      return;
    }

    setRedirectingPartnerId(match.partnerId);
    try {
      const redirect = await partnerRedirectService.create({
        partnerId: match.partnerId,
        partnerSlug: match.partnerId,
        sourcePage: '/resultado',
        productType: match.productType,
        utm: {
          source: 'cotejuros',
          medium: 'resultado',
          campaign: match.productType || 'parceiro'
        },
        metadata: {
          matchScore: match.matchScore,
          chanceLabel: match.chanceLabel
        }
      });

      await trackEvent('redirect_started', {
        sourcePage: '/resultado',
        partnerId: match.partnerId,
        destination: 'partner_redirect',
        clickId: redirect?.clickId
      });
      window.location.href = redirect.redirectUrl || redirect.resolvedUrl;
    } catch (error) {
      setStatus('Não foi possível abrir essa opção agora. Tente novamente em instantes.');
    } finally {
      setRedirectingPartnerId('');
    }
  };

  return (
    <PlatformShell title="Diagnóstico financeiro | Cote Juros">
      <SeoHead
        title="Diagnóstico financeiro | Cote Juros"
        description="Veja um diagnóstico financeiro indicativo com caminhos possíveis para o seu perfil."
        path="/resultado"
      />

      <div className="page active" id="page-resultado">
        <section className="inner-hero result-hero">
          <div className="container">
            <div className="result-hero-grid">
              <div>
                <div className="inner-hero-badge"><span className="hero-badge-dot" /> Resultado indicativo</div>
                <h1>Seu diagnóstico financeiro está pronto</h1>
                <p className="section-desc">
                  Com base nas informações preenchidas, encontramos caminhos que podem fazer sentido para o seu perfil.
                </p>
                <p className="result-hero-disclaimer">
                  Este resultado não representa aprovação de crédito. As condições finais dependem da análise dos parceiros.
                </p>
                <div className="result-hero-actions">
                  <Link className="btn-primary" to="/comparar">Comparar ofertas <ArrowUpRight size={14} /></Link>
                  <Link className="btn-outline" to="/quiz">Refazer análise</Link>
                </div>
              </div>

              <aside className="result-score-card">
                <div className="dash-badge">Perfil analisado</div>
                <div className="result-score-value">{recommendation.score}/100</div>
                <div className="result-score-label">Boa compatibilidade</div>
                <p>
                  Seu perfil apresenta sinais positivos para consulta com parceiros, mas a aprovação depende da análise final.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section id="trust-strip">
          <div className="container">
            <div className="trust-inner">
              {[
                ['Sem cobrança antecipada', ShieldCheck],
                ['Análise indicativa', ClipboardCheck],
                ['Dados sob consentimento', LockKeyhole]
              ].map(([label, Icon]) => (
                <div className="trust-item" key={label}>
                  <div className="trust-icon-wrap"><Icon size={15} color="var(--accent-light)" strokeWidth={2.2} /></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad result-section">
          <div className="container">
            <div className="result-layout">
              <main className="result-main">
                {resultCards.length ? resultCards.map(({ key, match, Icon, title, badge, description, compatibility, cta, note }) => (
                  <article key={key} className="compare-card result-path-card">
                    <div className="compare-card-main">
                      <div className="bank-logo"><Icon size={18} color="currentColor" strokeWidth={2.2} /></div>
                      <div>
                        <div className="compare-card-title">{title}</div>
                        <div className="compare-card-subtitle">{description}</div>
                        <div className="compare-card-tags">
                          <span className="tag">{badge}</span>
                          <span className="tag">Parceiro verificado</span>
                        </div>
                      </div>
                    </div>

                    <div className="compare-card-rate">
                      <div className="rate-big">{compatibility.replace('Compatibilidade estimada: ', '')}</div>
                      <div className="rate-desc">compatibilidade</div>
                    </div>

                    <div className="compare-card-action">
                      <button type="button" onClick={() => handlePartnerClick(match)} disabled={redirectingPartnerId === match.partnerId} className="btn-primary">
                        {redirectingPartnerId === match.partnerId ? 'Preparando...' : cta}
                        <ArrowUpRight size={13} />
                      </button>
                      {note ? <span className="result-card-note">{note}</span> : null}
                    </div>

                    {match.actionType === 'eligibility' ? (
                      <label className="result-consent">
                        <input type="checkbox" checked={Boolean(consents[match.partnerId]?.accepted)} onChange={(event) => event.target.checked && acceptConsent(match.partnerId)} />
                        <span>Autorizo a Cote Juros a compartilhar meus dados com o parceiro responsável para análise de crédito.</span>
                      </label>
                    ) : null}
                  </article>
                )) : (
                  <div className="creditas-card result-empty-card">
                    <h2>Ainda não encontramos uma opção clara.</h2>
                    <p>Tente reduzir o valor solicitado, informar renda/cidade ou revisar a finalidade do crédito.</p>
                    <Link className="btn-primary" to="/quiz">Refazer análise</Link>
                  </div>
                )}

                {status ? <div className="api-ready-note result-status">{status}</div> : null}

                <div className="api-ready-note result-legal-note">
                  <ShieldCheck size={16} color="var(--accent-light)" strokeWidth={2.2} />
                  <span>A Cote Juros não é banco, não concede crédito diretamente, não garante aprovação e não cobra taxa antecipada. As opções apresentadas dependem da análise e critérios dos parceiros.</span>
                </div>
              </main>

              <aside className="result-sidebar">
                <section className="creditas-card result-insight-card">
                  <div className="result-side-icon"><ClipboardCheck size={18} color="var(--accent-light)" strokeWidth={2.2} /></div>
                  <h2>Como calculamos este diagnóstico</h2>
                  <p>
                    Usamos as informações preenchidas no quiz, como renda informada, valor desejado, objetivo do crédito e existência de garantia.
                  </p>
                  <div className="result-check-list">
                    {['Renda informada', 'Valor solicitado', 'Perfil declarado', 'Tipo de crédito desejado', 'Existência de garantia', 'Critérios dos parceiros'].map((item) => (
                      <div key={item}>
                        <BadgeCheck size={14} color="var(--accent-light)" strokeWidth={2.2} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {summaryItems.length ? (
                    <div className="result-summary-grid">
                      {summaryItems.map(([label, value]) => (
                        <div key={label} className="dashboard-api-item">
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="creditas-card result-insight-card">
                  <div className="result-side-icon"><LockKeyhole size={18} color="var(--accent-light)" strokeWidth={2.2} /></div>
                  <h2>Preciso informar CPF ou conectar Open Finance?</h2>
                  <p>
                    Neste primeiro diagnóstico, não é obrigatório conectar Open Finance. Alguns parceiros podem solicitar CPF, dados adicionais ou autorização de consulta para realizar a análise final.
                  </p>
                  <div className="api-ready-note">Sem CPF ou dados complementares, o resultado permanece apenas indicativo.</div>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

export default ResultadoPage;
