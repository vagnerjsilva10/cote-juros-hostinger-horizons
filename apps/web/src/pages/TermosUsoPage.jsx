
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function TermosUsoPage() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso - Cote Juros</title>
        <meta name="description" content="Termos de uso da plataforma Cote Juros. Leia antes de utilizar nossos serviços." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-12 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Termos de uso
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
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceitação dos termos</h2>
                  <p>
                    Ao acessar e usar a plataforma Cote Juros, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Descrição dos serviços</h2>
                  <p>
                    A Cote Juros é uma plataforma de comparação de produtos financeiros que permite aos usuários:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Comparar taxas e condições de empréstimos, cartões de crédito e financiamentos</li>
                    <li>Utilizar calculadoras e simuladores financeiros</li>
                    <li>Acessar conteúdo educativo sobre finanças pessoais</li>
                    <li>Receber ofertas personalizadas de instituições financeiras parceiras</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Cadastro e conta de usuário</h2>
                  <p>
                    Para utilizar alguns recursos da plataforma, você pode precisar criar uma conta. Você é responsável por:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Fornecer informações precisas e atualizadas</li>
                    <li>Manter a confidencialidade de suas credenciais de acesso</li>
                    <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Uso aceitável</h2>
                  <p>Você concorda em não:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Usar a plataforma para fins ilegais ou não autorizados</li>
                    <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                    <li>Interferir no funcionamento adequado da plataforma</li>
                    <li>Copiar, modificar ou distribuir conteúdo sem autorização</li>
                    <li>Fornecer informações falsas ou enganosas</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Propriedade intelectual</h2>
                  <p>
                    Todo o conteúdo da plataforma Cote Juros, incluindo textos, gráficos, logotipos, ícones e software, é propriedade da Cote Juros ou de seus licenciadores e está protegido por leis de direitos autorais e propriedade intelectual.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Isenção de responsabilidade</h2>
                  <p>
                    A Cote Juros fornece informações para fins comparativos e educacionais. Não somos uma instituição financeira e não concedemos crédito. As informações apresentadas são baseadas em dados públicos e podem não refletir as condições mais atuais. Recomendamos que você verifique todas as informações diretamente com as instituições financeiras antes de tomar qualquer decisão.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitação de responsabilidade</h2>
                  <p>
                    A Cote Juros não se responsabiliza por:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Decisões financeiras tomadas com base nas informações da plataforma</li>
                    <li>Erros ou imprecisões nas informações fornecidas por terceiros</li>
                    <li>Indisponibilidade temporária da plataforma</li>
                    <li>Danos diretos ou indiretos resultantes do uso da plataforma</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Modificações dos termos</h2>
                  <p>
                    Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas através do e-mail cadastrado ou por meio de aviso em nosso site. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Lei aplicável</h2>
                  <p>
                    Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa relacionada a estes termos será submetida à jurisdição exclusiva dos tribunais brasileiros.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Contato</h2>
                  <p>
                    Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do e-mail: legal@cotejuros.com.br
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

export default TermosUsoPage;
