import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

function CreditHeroPreview() {
  return (
    <div className="hero-simulation-card relative overflow-hidden rounded-[16px] border border-border bg-white p-6 sm:p-7">
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(37,99,235,0.04),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Preview</p>
            <h3 className="mt-2 text-slate-900">Veja caminhos possíveis</h3>
          </div>
          <div className="rounded-full border border-primary/10 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary">
            30%
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[30%] rounded-full bg-primary" />
        </div>

        <div className="space-y-3">
          <div className="rounded-[14px] border border-border bg-[#F8FAFC] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Valor desejado</p>
            <div className="mt-3 flex h-12 items-center rounded-[10px] border border-border bg-white px-4 text-[15px] font-medium text-slate-900">
              R$ 12.000
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-[#F8FAFC] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Renda mensal</p>
            <div className="mt-3 flex h-12 items-center rounded-[10px] border border-border bg-white px-4 text-[15px] font-medium text-slate-900">
              R$ 4.500
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Negativado?</p>
              </div>

              <div className="flex rounded-full border border-border bg-white p-1">
                <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                  Sim
                </button>
                <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-slate-500">
                  Não
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {['Sem pressão', 'Sem custo para começar'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-sm font-medium text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-primary-hover"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CreditHeroPreview;
