import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function PoliticaPrivacidadePage() {
  const sections = [
    ['O que coletamos', 'Podemos coletar nome, telefone, valor desejado, renda, tipo de trabalho, se há restrição no nome, dados de navegação e origem da visita.'],
    ['Por que usamos esses dados', 'Usamos essas informações para mostrar caminhos de crédito mais coerentes, registrar sua solicitação, melhorar a experiência e entender como as pessoas chegam até a Cote Juros.'],
    ['Com quem podemos compartilhar', 'Quando você decide seguir, podemos compartilhar os dados necessários com instituições ou serviços envolvidos na continuidade da solicitação. Não vendemos seus dados pessoais.'],
    ['O que não fazemos', 'Não cobramos valor antecipado, não prometemos aprovação e não usamos seus dados para fingir uma liberação de crédito pela Cote Juros.'],
    ['Cote Finance', 'O Cote Finance é um produto separado. Se você acessar esse produto, a experiência e o tratamento de dados seguem o contexto próprio dele.'],
    ['Seus direitos', 'Você pode pedir acesso, correção, exclusão, revogação de consentimento e informações sobre o uso dos seus dados.'],
    ['Contato', 'Para falar sobre privacidade, escreva para privacidade@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Política de privacidade - Cote Juros</title>
        <meta
          name="description"
          content="Veja como a Cote Juros usa dados para mostrar caminhos de crédito, registrar solicitações e conectar você com a próxima etapa quando fizer sentido."
        />
      </Helmet>

      <PageHero
        badge="Privacidade"
        title="Seus dados precisam ter um motivo claro."
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

export default PoliticaPrivacidadePage;
