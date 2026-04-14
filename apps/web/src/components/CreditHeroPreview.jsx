import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const fields = [
  { label: 'Valor desejado', value: 'R$ 12.000' },
  { label: 'Renda mensal', value: 'R$ 4.500' }
];

function CreditHeroPreview() {
  return (
    <div className="hero-simulation-card relative overflow-hidden rounded-[16px] border border-border bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Preview visual</p>
            <h3 className="mt-2 text-slate-950">Veja caminhos possíveis</h3>
            <p className="mt-2 text-sm text-slate-500">Uma prévia leve do fluxo, sem preencher nada agora.</p>
          </div>
          <div className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            30%
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[30%] rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#1D4ED8_100%)]" />
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="rounded-[16px] border border-border bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{field.label}</p>
              <div className="mt-3 flex h-12 items-center rounded-[10px] border border-border bg-white px-4 text-base font-semibold text-slate-900">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[16px] border border-border bg-[#F8FAFC] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Negativado?</p>
              <p className="mt-2 text-sm text-slate-600">Isso ajuda a mostrar caminhos mais compatíveis com o perfil.</p>
            </div>

            <div className="flex rounded-full border border-border bg-white p-1 shadow-sm">
              <button type="button" className="rounded-full bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">
                Sim
              </button>
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500">
                Não
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {['Sem pressão', 'Sem custo para começar'].map((item) => (
            <div key={item} className="rounded-[16px] border border-border bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-2 text-sm font-medium text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#10B981]" />
                {item}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#020617]"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CreditHeroPreview;
