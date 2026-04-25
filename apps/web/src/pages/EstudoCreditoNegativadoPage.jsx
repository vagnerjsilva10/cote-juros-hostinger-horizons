import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SeoHead from '@/components/SeoHead.jsx';
import { homeBreadcrumb } from '@/seo/brandSeo.js';

const dataRows = [
  ['Empréstimo pessoal sem garantia', 'Maior', 'Análise de renda, score e histórico', 'Comparar CET e evitar taxa antecipada'],
  ['Crédito com garantia de veículo', 'Menor que pessoal sem garantia', 'Risco de perder o bem', 'Avaliar prazo e valor total pago'],
  ['Cartão consignado', 'Pode parecer baixo no início', 'Desconto e uso recorrente do limite', 'Entender custo de saque e rotativo'],
  ['Renegociação de dívida', 'Variável', 'Acordo depende do credor', 'Priorizar desconto real e parcela que cabe']
];

const sourceLinks = [
  { label: 'Banco Central', url: 'https://www.bcb.gov.br/' },
  { label: 'Serasa', url: 'https://www.serasa.com.br/' },
  { label: 'SPC Brasil', url: 'https://www.spcbrasil.org.br/' }
];

function EstudoCreditoNegativadoPage() {
  return (
    <>
      <SeoHead
        title="Estudo: custo do crédito para negativado em 2026 | Cote Juros"
        description="Estudo editorial da Cote Juros sobre crédito para negativado, riscos, modalidades e pontos de comparação antes de contratar."
        path="/estudos/custo-emprestimo-negativado-2026"
        breadcrumbs={[homeBreadcrumb, { name: 'Estudos', path: '/estudos/custo-emprestimo-negativado-2026' }]}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: 'Custo do crédito para negativado em 2026',
            publisher: { '@type': 'Organization', name: 'Cote Juros' },
            inLanguage: 'pt-BR'
          }
        ]}
      />

      <section className="border-b border-border bg-background py-10 md:py-14">
        <div className="page-shell max-w-5xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Estudo Cote Juros 2026
          </div>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            Custo do crédito para negativado: riscos, alternativas e pontos de comparação
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Um material de referência para quem escreve, pesquisa ou compara crédito para pessoas com restrição no nome.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="#tabela-comparativa">
              <Button size="lg">Ver tabela</Button>
            </a>
            <Link to="/calculadora-cet">
              <Button size="lg" variant="outline">Usar calculadora de CET</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <article className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumo executivo</CardTitle>
              <CardDescription>Principais conclusões para citar em conteúdos e pautas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Crédito para negativado tende a ter custo mais alto porque o risco percebido pelo credor aumenta. Por isso, comparar somente a parcela pode esconder diferenças relevantes no custo total.</p>
              <p>As alternativas com garantia podem reduzir a taxa, mas transferem parte do risco para um bem do consumidor. Já ofertas sem garantia exigem cuidado maior com CET, tarifas e prazo.</p>
              <p>A melhor decisão depende de renda disponível, urgência, valor necessário, risco de inadimplência e existência de alternativas como renegociação.</p>
            </CardContent>
          </Card>

          <Card id="tabela-comparativa">
            <CardHeader>
              <CardTitle>Tabela comparativa</CardTitle>
              <CardDescription>Leitura qualitativa para orientar comparações iniciais.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Modalidade</th>
                      <th className="py-3 pr-4 font-medium">Tendência de custo</th>
                      <th className="py-3 pr-4 font-medium">Risco principal</th>
                      <th className="py-3 font-medium">O que comparar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row) => (
                      <tr key={row[0]} className="border-b border-border/70">
                        {row.map((cell) => (
                          <td key={cell} className="py-4 pr-4 align-top text-foreground/85">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metodologia editorial</CardTitle>
              <CardDescription>Como este estudo deve ser lido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Este material combina análise editorial da Cote Juros com critérios usados em educação financeira: CET, prazo, renda comprometida, risco de garantia e clareza contratual.</p>
              <p>Ele não substitui uma simulação formal nem representa taxa média oficial de mercado. O objetivo é oferecer um quadro de comparação para jornalistas, blogs e consumidores.</p>
            </CardContent>
          </Card>
        </article>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cite este estudo</CardTitle>
              <CardDescription>URL permanente para referência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-words rounded-[10px] border border-border bg-background-secondary p-3 text-sm text-muted-foreground">
                https://www.cotejuros.com.br/estudos/custo-emprestimo-negativado-2026
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4" />
                Relatório online
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fontes úteis</CardTitle>
              <CardDescription>Referências institucionais para aprofundar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sourceLinks.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[10px] border border-border p-3 text-sm font-medium text-foreground hover:bg-background-secondary">
                  {source.label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ferramentas relacionadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/calculadora-cet" className="block rounded-[10px] border border-border p-3 text-sm font-medium text-foreground hover:bg-background-secondary">Calculadora de CET</Link>
              <Link to="/simulador-comprometimento-renda" className="block rounded-[10px] border border-border p-3 text-sm font-medium text-foreground hover:bg-background-secondary">Simulador de renda</Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  );
}

export default EstudoCreditoNegativadoPage;
