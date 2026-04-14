import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const fields = [
  { label: 'Quanto você precisa?', value: 'R$ 12.000' },
  { label: 'Qual sua renda?', value: 'R$ 4.500' }
];

function CreditHeroPreview() {
  return (
    <div className="premium-panel hero-simulation-card relative overflow-hidden p-6 sm:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prévia do produto</p>
            <h3 className="mt-2 text-[1.375rem] font-semibold text-slate-950">Veja caminhos possíveis</h3>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Etapa 1 de 3
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[42%] rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#60A5FA_100%)]" />
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{field.label}</p>
              <div className="premium-input mt-3 flex items-center justify-between bg-white">
                <span>{field.value}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Editar</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Negativado?</p>
              <p className="mt-2 text-sm text-slate-600">Isso ajuda a mostrar caminhos mais próximos da sua realidade.</p>
            </div>
            <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button type="button" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Sim
              </button>
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500">
                Não
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sem pressão</p>
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              Você vê primeiro e decide depois.
            </div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sem custo para começar</p>
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              Sem cobrança antecipada.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-slate-950 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-px hover:bg-slate-900"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CreditHeroPreview;
