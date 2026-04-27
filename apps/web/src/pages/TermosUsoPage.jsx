import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function TermosUsoPage() {
  const sections = [
    ['Uso da Cote Juros', 'Ao usar o site, você concorda em informar dados verdadeiros e usar a experiência de forma lícita e responsável.'],
    ['Nosso papel', 'A Cote Juros ajuda você a encontrar caminhos de crédito, comparar informações e seguir para a próxima etapa com parceiros.'],
    ['O que não somos', 'Não somos banco, não concedemos crédito diretamente, não garantimos aprovação e não cobramos valor antecipado para liberação de crédito.'],
    ['Parceiros e condições', 'Taxas, limites, prazos, aprovação e contratação final dependem do parceiro, da análise feita por ele e das regras vigentes no momento da solicitação.'],
    ['Conteúdo e simulações', 'Conteúdos, comparações e simulações servem como apoio para decisão. Eles não substituem proposta formal, contrato ou orientação profissional individual.'],
    ['Cote Finance', 'Cote Finance é um produto separado de organização financeira. Ele pode aparecer em áreas secundárias do ecossistema, mas não faz parte da concessão de crédito.'],
    ['Contato', 'Para dúvidas sobre os termos, escreva para legal@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Termos de uso - Cote Juros</title>
        <meta
          name="description"
          content="Entenda os termos de uso da Cote Juros e o papel do site na comparação e encaminhamento de caminhos de crédito."
        />
      </Helmet>

      <PageHero
        badge="Termos"
        title="Uma relação clara desde o primeiro clique."
        subtitle={`Última atualização: ${new Date().toLocaleDateString('pt-BR')}`}
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl space-y-10">
            {sections.map(([title, copy]) => (
              <div key={title} className="rounded-[16px] border border-border bg-background-secondary p-8">
                <h3 className="mb-3">{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default TermosUsoPage;
