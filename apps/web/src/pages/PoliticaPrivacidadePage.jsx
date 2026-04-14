import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function PoliticaPrivacidadePage() {
  const sections = [
    ['O que coletamos', 'Podemos coletar nome, telefone, valor desejado, renda, tipo de trabalho, se ha restricao no nome, dados de navegacao e origem da visita.'],
    ['Por que usamos esses dados', 'Usamos essas informacoes para mostrar caminhos de credito mais coerentes, registrar sua solicitacao, melhorar a experiencia e acompanhar a origem dos leads.'],
    ['Com quem podemos compartilhar', 'Quando voce decide seguir, podemos compartilhar dados necessarios com parceiros de credito ou servicos de operacao. Nao vendemos seus dados pessoais.'],
    ['O que nao fazemos', 'Nao cobramos valor antecipado, nao prometemos aprovacao e nao usamos seus dados para fingir uma liberacao de credito pela Cote Juros.'],
    ['Cote Finance', 'Cote Finance e um produto separado. Se voce acessar esse produto, a experiencia e o tratamento de dados seguem o contexto proprio dele.'],
    ['Seus direitos', 'Voce pode pedir acesso, correcao, exclusao, revogacao de consentimento e informacoes sobre o uso dos seus dados.'],
    ['Contato', 'Para falar sobre privacidade, escreva para privacidade@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Politica de privacidade - Cote Juros</title>
        <meta
          name="description"
          content="Veja como a Cote Juros usa dados para mostrar caminhos de credito, registrar leads e conectar usuarios com parceiros."
        />
      </Helmet>

      <PageHero
        badge="Privacidade"
        title="Seus dados precisam ter um motivo claro."
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

export default PoliticaPrivacidadePage;
