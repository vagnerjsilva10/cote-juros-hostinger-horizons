import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getDeliveryModeLabel, getLeadProfileLabel, getLeadStatusLabel } from '@/admin/adminLabels.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function LeadNextStepPage() {
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const leadResult = location.state?.leadResult || null;

  useEffect(() => {
    if (!leadResult?.redirectUrl || leadResult.deliveryMode !== 'tracking_link') return undefined;

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          window.location.href = leadResult.redirectUrl;
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [leadResult?.deliveryMode, leadResult?.redirectUrl]);

  return (
    <>
      <Helmet>
        <title>Proxima etapa | Cote Juros</title>
        <meta
          name="description"
          content="Veja a proxima etapa da sua jornada de credito com mais clareza."
        />
      </Helmet>

      <section className="min-h-[72vh] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f7f9fc_100%)] py-16">
        <div className="page-shell">
          <Card className="mx-auto max-w-3xl rounded-[28px] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <CardContent className="px-7 py-10 text-center sm:px-10 sm:py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>

              <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
                Pronto. Agora ficou mais facil seguir
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
                {leadResult?.deliveryMode === 'mock_api'
                  ? 'Recebemos seus dados e registramos a proxima etapa com uma opcao que pode fazer sentido para o seu perfil.'
                  : 'Estamos te direcionando para a proxima etapa com uma opcao que pode fazer sentido para voce.'}
              </p>

              {leadResult?.partnerName ? (
                <div className="mx-auto mt-6 grid max-w-2xl gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 text-left sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Parceiro</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{leadResult.partnerName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Envio</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {leadResult.deliveryMode === 'tracking_link' ? 'Redirecionamento seguro' : getDeliveryModeLabel(leadResult.deliveryMode)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Perfil</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{getLeadProfileLabel(leadResult.profile)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{getLeadStatusLabel(leadResult.status || 'sent')}</p>
                  </div>
                </div>
              ) : null}

              {leadResult?.deliveryMode === 'tracking_link' && leadResult?.redirectUrl ? (
                <div className="mt-8 space-y-4">
                  <p className="text-sm text-slate-500">
                    Voce sera direcionado em <span className="font-semibold text-slate-900">{countdown}s</span>. Se preferir, pode continuar agora.
                  </p>
                  <a href={leadResult.redirectUrl}>
                    <Button className="h-12 rounded-[14px] bg-slate-950 px-7 text-sm font-semibold text-white hover:bg-slate-800">
                      Continuar agora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="mt-8">
                  <Link to="/emprestimos">
                    <Button className="h-12 rounded-[14px] bg-slate-950 px-7 text-sm font-semibold text-white hover:bg-slate-800">
                      Ver opcoes de emprestimo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}

              <p className="mx-auto mt-8 max-w-2xl text-xs leading-6 text-slate-500">
                A Cote Juros nao e banco, nao concede credito diretamente e nao garante aprovacao. Nao cobramos valor antecipado. A decisao final depende das regras do parceiro.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export default LeadNextStepPage;
