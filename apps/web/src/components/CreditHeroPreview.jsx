import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

function CreditHeroPreview() {
  return (
    <div className="hero-simulation-card relative overflow-hidden rounded-[20px] border border-border bg-white p-6 sm:p-7">
      <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(37,99,235,0.045),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/75">Veja caminhos possíveis</p>
            <h3 className="mt-2 text-[1.06rem] font-medium text-slate-900">Comece pelo essencial</h3>
          </div>
          <div className="rounded-full border border-primary/10 bg-primary/[0.04] px-3 py-1 text-[11px] font-medium text-primary">
            30%
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[30%] rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#4F46E5_52%,#7C3AED_100%)]" />
        </div>

        <div className="space-y-3">
          <div className="rounded-[16px] border border-border bg-[#F8FAFC] px-4 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Valor desejado</p>
            <div className="mt-2.5 text-[15px] font-medium text-slate-900">R$ 12.000</div>
          </div>

          <div className="rounded-[16px] border border-border bg-[#F8FAFC] px-4 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Renda mensal</p>
            <div className="mt-2.5 text-[15px] font-medium text-slate-900">R$ 4.500</div>
          </div>

          <div className="rounded-[16px] border border-border bg-[#F8FAFC] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Negativado?</p>

              <div className="flex rounded-full border border-border bg-white p-1">
                <button type="button" className="rounded-full bg-slate-950 px-3.5 py-1.5 text-[11px] font-medium text-white">
                  Sim
                </button>
                <button type="button" className="rounded-full px-3.5 py-1.5 text-[11px] font-medium text-slate-500">
                  Não
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {['Sem compromisso', 'Sem cobrança para começar'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px] text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="hero-preview-cta flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-sm font-medium text-white"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CreditHeroPreview;
