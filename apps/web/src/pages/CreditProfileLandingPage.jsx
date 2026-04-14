import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';

function ProfilePreviewCard({ badge }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08)_0%,rgba(255,255,255,0)_100%)] p-7">
        <span className="section-eyebrow bg-white">{badge}</span>
        <h3 className="mt-4 text-slate-950">Com base no seu perfil...</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          A leitura começa por sinais do seu momento atual para reduzir ruído e mostrar caminhos mais coerentes.
        </p>
      </div>

      <div className="grid gap-4 border-t border-border p-7 sm:grid-cols-2">
        <div className="rounded-[18px] border border-border bg-[#F8FAFC] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Análise interna</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Primeiro você entende contexto, encaixe e possibilidades dentro da Cote Juros.
          </p>
        </div>
        <div className="rounded-[18px] border border-border bg-[#F8FAFC] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Próxima etapa</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Só depois disso, se fizer sentido, você segue para um parceiro com mais clareza.
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

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f7f9fc_100%)]">
        <div className="page-shell py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-[620px]">
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                {badge}
              </span>
              <h1 className="mt-5 text-slate-950">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-[35rem] text-base leading-8 text-slate-600 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => setModalOpen(true)}
                >
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
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
            <h2 className="text-slate-950">Fluxo claro: contexto, opções, decisão e só depois saída</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              A experiência foi desenhada para não misturar análise interna com contratação externa.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['Contexto', 'Você começa descrevendo o básico do seu momento atual.'],
              ['Opções', 'A plataforma organiza caminhos possíveis antes de te levar para fora.'],
              ['Decisão', 'Se fizer sentido, você segue para o parceiro com expectativa mais alinhada.']
            ].map(([stepTitle, stepDescription]) => (
              <Card key={stepTitle} className="rounded-[24px] border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <CardContent className="p-7">
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
          <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Transparência</span>
                <h2 className="mt-4 text-slate-950">Nosso papel é ajudar a entender o cenário com mais clareza</h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  A Cote Juros não é banco e não promete aprovação. O objetivo é reduzir confusão, organizar possibilidades e deixar a decisão mais segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bg-slate-50/70">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-primary/20 bg-white px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-slate-950">Sem compromisso e sem cobrança antecipada</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Comece pelo diagnóstico rápido e veja caminhos possíveis sem assumir nada antes da hora.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={() => setModalOpen(true)}>
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
