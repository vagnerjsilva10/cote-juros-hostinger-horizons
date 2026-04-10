
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function PoliticaPrivacidadePage() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade - Cote Juros</title>
        <meta name="description" content="Política de privacidade da Cote Juros. Saiba como protegemos seus dados pessoais." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-12 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Política de privacidade
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose prose-lg">
              <div className="space-y-8 text-muted-foreground leading-relaxed">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introdução</h2>
                  <p>
                    A Cote Juros está comprometida em proteger a privacidade e segurança dos dados pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Informações que coletamos</h2>
                  <p>Coletamos as seguintes informações:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Dados de identificação: nome, CPF, e-mail, telefone</li>
                    <li>Dados financeiros: renda mensal, score de crédito aproximado</li>
                    <li>Dados de navegação: páginas visitadas, tempo de permanência, dispositivo utilizado</li>
                    <li>Dados de simulação: valores solicitados, tipos de crédito consultados</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Como usamos suas informações</h2>
                  <p>Utilizamos suas informações para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Fornecer comparações personalizadas de produtos financeiros</li>
                    <li>Melhorar nossos serviços e experiência do usuário</li>
                    <li>Enviar comunicações sobre produtos e serviços relevantes</li>
                    <li>Cumprir obrigações legais e regulatórias</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Compartilhamento de dados</h2>
                  <p>
                    Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas com:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Instituições financeiras parceiras, mediante seu consentimento explícito</li>
                    <li>Prestadores de serviços que nos auxiliam na operação da plataforma</li>
                    <li>Autoridades governamentais, quando exigido por lei</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Segurança dos dados</h2>
                  <p>
                    Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL/TLS para transmissão de dados sensíveis.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Seus direitos</h2>
                  <p>Você tem direito a:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar consentimentos previamente fornecidos</li>
                    <li>Solicitar a portabilidade de seus dados</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies</h2>
                  <p>
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência em nosso site. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades da plataforma.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Alterações nesta política</h2>
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através do e-mail cadastrado ou por meio de aviso em nosso site.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Contato</h2>
                  <p>
                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco através do e-mail: privacidade@cotejuros.com.br
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default PoliticaPrivacidadePage;
