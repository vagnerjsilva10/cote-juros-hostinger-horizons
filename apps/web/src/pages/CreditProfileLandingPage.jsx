import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';

function ProfilePreviewCard({ badge }) {
  return (
    <div className="hero-card max-w-[440px]">
      <div className="rounded-[16px] border border-[var(--line-soft)] bg-white/90 p-4">
        <span className="section-eyebrow bg-white">{badge}</span>
        <h3 className="mt-4 text-[18px] font-medium text-[var(--heading-color)]">Comece vendo o que pode fazer sentido</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          A leitura começa pelo seu perfil para mostrar opções mais coerentes antes de qualquer contratação.
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] border border-[var(--line-soft)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Comparação interna</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Você compara opções e entende o cenário antes de sair da CoteJuros.
          </p>
        </div>
        <div className="rounded-[14px] border border-[var(--line-soft)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Próxima etapa</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Se fizer sentido, aí sim você segue para um parceiro com mais clareza.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreditProfileLandingPage({
  canonicalPath,
  title,
  description,
  badge,
  heroTitle,
  heroDescription,
  trustLine
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://cotejuros.com.br${canonicalPath}`} />
      </Helmet>

      <QuickCreditFlowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourcePage={canonicalPath}
        originLabel={canonicalPath.replace(/\//g, '-') || 'lp'}
      />

      <section className="hero-section border-b border-white/[0.06]">
        <div className="hero-ambient-grid" aria-hidden="true" />
        <div className="hero-ambient-orb hero-ambient-orb-one" aria-hidden="true" />
        <div className="hero-ambient-orb hero-ambient-orb-two" aria-hidden="true" />
        <div className="page-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow">{badge}</span>
              <h1 className="hero-title">{heroTitle}</h1>
              <p className="hero-subtitle">{heroDescription}</p>

              <div className="hero-actions">
                <Button size="lg" className="hero-primary-btn" onClick={() => setModalOpen(true)}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="hero-secondary-btn">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="hero-trust">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                  <span>{trustLine}</span>
                </div>
              </div>
            </div>

            <ProfilePreviewCard badge={badge} />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section section--compact bg-white">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title">Primeiro você entende. Depois compara. Só então decide.</h2>
            <p className="section-subtitle">
              A experiência foi desenhada para não misturar comparação com contratação.
            </p>
          </div>

          <div className="steps-grid">
            {[
              ['Perfil', 'Você começa descrevendo o básico do seu momento.'],
              ['Opções', 'A plataforma organiza caminhos possíveis antes de te levar para fora.'],
              ['Decisão', 'Se fizer sentido, você segue com expectativa mais alinhada.']
            ].map(([stepTitle, stepDescription]) => (
              <Card key={stepTitle} className="card">
                <CardContent className="p-0">
                  <h3 className="card-title">{stepTitle}</h3>
                  <p className="card-text">{stepDescription}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact bg-[var(--surface-soft)]">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[22px] border border-[var(--line-soft)] bg-white px-7 py-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3">
                <ShieldCheck className="h-6 w-6 text-[var(--text-strong)]" />
              </div>
              <div>
                <span className="section-eyebrow bg-[var(--surface-soft)]">Transparência</span>
                <h2 className="mt-4 text-[28px] font-medium leading-[1.1] text-[var(--heading-color)]">
                  Nosso papel é ajudar você a comparar com mais clareza
                </h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-[1.65] text-[var(--text-soft)]">
                  A CoteJuros não é banco e não promete aprovação. O objetivo é mostrar opções e organizar a decisão com mais segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--compact bg-[var(--surface-soft)]">
        <div className="page-shell">
          <div className="mx-auto max-w-[760px] rounded-[22px] border border-[var(--line-soft)] bg-white px-8 py-8 text-center shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <h2 className="section-title !mb-3 max-w-[520px]">Sem compromisso e sem cobrança antecipada</h2>
            <p className="section-subtitle !mb-6 max-w-[520px]">
              Preencha o básico e veja caminhos possíveis antes de contratar qualquer crédito.
            </p>
            <Button size="lg" className="hero-primary-btn" onClick={() => setModalOpen(true)}>
              Ver minhas opções agora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default CreditProfileLandingPage;
