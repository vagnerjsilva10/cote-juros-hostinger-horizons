import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';

function PlaceholderAsset({ name }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {name}
        </div>
        <div className="h-32 rounded-[22px] bg-slate-50" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-[18px] bg-slate-50" />
          <div className="h-24 rounded-[18px] bg-slate-50" />
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

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f7f9fc_100%)]">
        <div className="page-shell py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-[620px]">
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                {badge}
              </span>
              <h1
                className="mt-5 text-[clamp(2.4rem,7vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.055em] text-slate-950"
                style={{ fontFamily: '"Space Grotesk", "Manrope", sans-serif' }}
              >
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-[35rem] text-base leading-8 text-slate-600 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 rounded-[14px] bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] hover:bg-slate-800"
                  onClick={() => setModalOpen(true)}
                >
                  Ver minhas opcoes agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="h-12 rounded-[14px] border-slate-300 px-6 text-sm font-semibold">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {trustLine}
              </div>
            </div>

            <PlaceholderAsset name="profile-section-placeholder" />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-b border-slate-200 bg-white py-18 sm:py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
              Comece com o basico
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              Voce responde algumas perguntas rapidas e ve caminhos possiveis antes de decidir se quer seguir.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['Conte o que voce precisa', 'Valor, renda, trabalho e um contato simples para continuar.'],
              ['Veja caminhos possiveis', 'Mostramos opcoes que podem combinar melhor com o seu momento.'],
              ['Decida com calma', 'Se fizer sentido para voce, e so seguir para a proxima etapa.']
            ].map(([stepTitle, stepDescription]) => (
              <Card key={stepTitle} className="rounded-[24px] border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <CardContent className="p-7">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{stepTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{stepDescription}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-18 sm:py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
              Sem compromisso e sem cobranca antecipada
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              A Cote Juros nao e banco e nao garante aprovacao. Nosso papel e te ajudar a encontrar caminhos possiveis com mais clareza.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="h-12 rounded-[14px] bg-slate-950 px-7 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] hover:bg-slate-800"
                onClick={() => setModalOpen(true)}
              >
                Ver minhas opcoes agora
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
