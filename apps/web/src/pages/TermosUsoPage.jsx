import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function TermosUsoPage() {
  const sections = [
    ['Uso da Cote Juros', 'Ao usar o site, voce concorda em informar dados verdadeiros e usar a experiencia de forma licita e responsavel.'],
    ['Nosso papel', 'A Cote Juros ajuda voce a encontrar caminhos de credito, comparar informacoes e seguir para a proxima etapa com parceiros.'],
    ['O que nao somos', 'Nao somos banco, nao concedemos credito diretamente, nao garantimos aprovacao e nao cobramos valor antecipado para liberacao de credito.'],
    ['Parceiros e condicoes', 'Taxas, limites, prazos, aprovacao e contratacao final dependem do parceiro, da analise feita por ele e das regras vigentes no momento da solicitacao.'],
    ['Conteudo e simulacoes', 'Conteudos, comparacoes e simulacoes servem como apoio para decisao. Eles nao substituem proposta formal, contrato ou orientacao profissional individual.'],
    ['Cote Finance', 'Cote Finance e um produto separado de organizacao financeira. Ele pode aparecer em areas secundarias do ecossistema, mas nao faz parte da concessao de credito.'],
    ['Contato', 'Para duvidas sobre os termos, escreva para legal@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Termos de uso - Cote Juros</title>
        <meta
          name="description"
          content="Entenda os termos de uso da Cote Juros e o papel do site na comparacao e encaminhamento de caminhos de credito."
        />
      </Helmet>

      <PageHero
        badge="Termos"
        title="Uma relacao clara desde o primeiro clique."
        subtitle={`Ultima atualizacao: ${new Date().toLocaleDateString('pt-BR')}`}
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
