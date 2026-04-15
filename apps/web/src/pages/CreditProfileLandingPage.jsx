import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';

function ProfilePreviewCard({ badge }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="bg-[linear-gradient(180deg,rgba(37,99,235,0.10)_0%,rgba(255,255,255,0)_100%)] p-6">
        <span className="section-eyebrow bg-white">{badge}</span>
        <h3 className="mt-4 text-slate-950">Comece vendo o que pode fazer sentido</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          A leitura começa pelo seu perfil para mostrar opções mais coerentes antes de qualquer contratação.
        </p>
      </div>

      <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-[#F8FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Comparação interna</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Você compara opções e entende o cenário antes de sair da Cote Juros.
          </p>
        </div>
        <div className="rounded-[16px] border border-border bg-[#F8FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Próxima etapa</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
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

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-premium-credit absolute inset-0" />
          <div className="hero-tech-grid absolute inset-0 opacity-[0.08]" />
          <div className="hero-top-glow absolute left-1/2 top-0 h-40 w-[38rem] -translate-x-1/2" />
        </div>

        <div className="page-shell relative py-12 sm:py-14 lg:py-16">
          <div className="grid items-start gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-[620px]">
              <span className="section-eyebrow border-white/80 bg-white/92">{badge}</span>
              <h1 className="mt-5 text-slate-950">{heroTitle}</h1>
              <p className="mt-4 max-w-[35rem] text-base leading-[1.72] text-slate-600 sm:text-[1.02rem]">
                {heroDescription}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="hero-primary-cta h-12 px-6" onClick={() => setModalOpen(true)}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="h-12">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                {trustLine}
              </div>
            </div>

            <ProfilePreviewCard badge={badge} />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-slate-950">Primeiro você entende. Depois compara. Só então decide.</h2>
            <p className="mt-3 text-base leading-[1.72] text-slate-600 sm:text-[1.02rem]">
              A experiência foi desenhada para não misturar comparação com contratação.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['Perfil', 'Você começa descrevendo o básico do seu momento.'],
              ['Opções', 'A plataforma organiza caminhos possíveis antes de te levar para fora.'],
              ['Decisão', 'Se fizer sentido, você segue com expectativa mais alinhada.']
            ].map(([stepTitle, stepDescription]) => (
              <Card key={stepTitle} className="rounded-[20px] border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <CardContent className="p-6">
                  <h3 className="text-slate-950">{stepTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{stepDescription}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-slate-50/70">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:px-9 sm:py-9">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Transparência</span>
                <h2 className="mt-4 text-slate-950">Nosso papel é ajudar você a comparar com mais clareza</h2>
                <p className="mt-3 max-w-3xl text-base leading-[1.76] text-slate-600">
                  A Cote Juros não é banco e não promete aprovação. O objetivo é mostrar opções e organizar a decisão com mais segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bg-slate-50/70">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-primary/20 bg-white px-8 py-9 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-slate-950">Sem compromisso e sem cobrança antecipada</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-[1.72] text-slate-600">
              Preencha o básico e veja caminhos possíveis antes de contratar qualquer crédito.
            </p>
            <div className="mt-7 flex justify-center">
              <Button size="lg" className="hero-primary-cta h-12 px-6" onClick={() => setModalOpen(true)}>
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default CreditProfileLandingPage;
