import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AdSenseScript from '@/components/AdSenseScript.tsx';

import HomePage from '@/pages/HomePage.jsx';
import EmprestimosPage from '@/pages/EmprestimosPage.jsx';
import CartoesPage from '@/pages/CartoesPage.jsx';
import FinanciamentoPage from '@/pages/FinanciamentoPage.jsx';
import FerramentasPage from '@/pages/FerramentasPage.jsx';
import DiagnosticoPage from '@/pages/DiagnosticoPage.jsx';
import BlogPage from '@/pages/BlogPage.jsx';
import BlogArticlePage from '@/pages/BlogArticlePage.jsx';
import BlogRouteBoundary from '@/components/blog/BlogRouteBoundary.jsx';
import SobreNosPage from '@/pages/SobreNosPage.jsx';
import ContatoPage from '@/pages/ContatoPage.jsx';
import PoliticaPrivacidadePage from '@/pages/PoliticaPrivacidadePage.jsx';
import TermosUsoPage from '@/pages/TermosUsoPage.jsx';
import SeoLandingPage from '@/pages/SeoLandingPage.jsx';
import CoteFinanceAIPage from '@/pages/CoteFinanceAIPage.jsx';
import MotionHeroPage from '@/pages/MotionHeroPage.jsx';
import SeoProgrammaticPage from '@/pages/SeoProgrammaticPage.jsx';

import AdminAuthGuard from '@/admin/AdminAuthGuard.jsx';
import AdminLayout from '@/admin/AdminLayout.jsx';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.jsx';
import AdminOffersPage from '@/pages/admin/AdminOffersPage.jsx';
import AdminBanksPage from '@/pages/admin/AdminBanksPage.jsx';
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage.jsx';
import AdminArticlesPage from '@/pages/admin/AdminArticlesPage.jsx';
import AdminSeoPagesPage from '@/pages/admin/AdminSeoPagesPage.jsx';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage.jsx';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage.jsx';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage.jsx';

import { seoFallbackPaths as seedFallbackPaths, seoPages as seedSeoPages } from '@/platform/seed/portalSeed.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Toaster } from '@/components/ui/sonner';
import { corePillarPaths, reservedSeoStaticPaths } from '@/seo/seoCatalog.js';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col bg-background selection:bg-primary/10">
      <Header />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminRoute({ title, children }) {
  return (
    <AdminAuthGuard>
      <AdminLayout title={title}>{children}</AdminLayout>
    </AdminAuthGuard>
  );
}

function BlogBoundary({ children }) {
  const location = useLocation();

  return <BlogRouteBoundary resetKey={location.pathname}>{children}</BlogRouteBoundary>;
}

function App() {
  const [seoPages, setSeoPages] = useState(seedSeoPages);
  const [seoFallbackPaths, setSeoFallbackPaths] = useState(seedFallbackPaths);

  const blockedSeedSeoPaths = useMemo(() => {
    const blocked = new Set([...reservedSeoStaticPaths, ...corePillarPaths]);
    blocked.add('/cartoes-de-credito');
    blocked.add('/financiamento');
    blocked.add('/diagnostico-financeiro');
    blocked.add('/cote-finance-ai');
    blocked.add('/sobre-nos');
    blocked.add('/contato');
    blocked.add('/politica-de-privacidade');
    blocked.add('/termos-de-uso');
    return blocked;
  }, []);

  const shouldSkipSeedSeoPage = (path = '') => {
    if (!path) return true;
    if (blockedSeedSeoPaths.has(path)) return true;
    if (path.startsWith('/comparar/')) return true;
    if (path.startsWith('/banco/')) return true;
    if (path.startsWith('/cartao/')) return true;
    if (path.startsWith('/blog/')) return true;
    return false;
  };

  useEffect(() => {
    Promise.all([portalApi.getSeoPages(), portalApi.getSeoFallbackPaths()])
      .then(([pages, fallbackPaths]) => {
        if (Array.isArray(pages) && pages.length) setSeoPages(pages);
        if (Array.isArray(fallbackPaths) && fallbackPaths.length) setSeoFallbackPaths(fallbackPaths);
      })
      .catch(() => {
        // keep seed fallback
      });
  }, []);

  return (
    <Router>
      <AdSenseScript />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/emprestimos" element={<AppLayout><EmprestimosPage /></AppLayout>} />
        <Route path="/cartoes" element={<AppLayout><CartoesPage /></AppLayout>} />
        <Route path="/cartoes-de-credito" element={<AppLayout><CartoesPage /></AppLayout>} />
        <Route path="/financiamentos" element={<AppLayout><FinanciamentoPage /></AppLayout>} />
        <Route path="/financiamento" element={<AppLayout><FinanciamentoPage /></AppLayout>} />
        <Route path="/ferramentas" element={<AppLayout><FerramentasPage /></AppLayout>} />
        <Route path="/diagnostico-financeiro" element={<AppLayout><DiagnosticoPage /></AppLayout>} />
        <Route
          path="/blog"
          element={
            <AppLayout>
              <BlogBoundary>
                <BlogPage />
              </BlogBoundary>
            </AppLayout>
          }
        />
        <Route path="/sobre-nos" element={<AppLayout><SobreNosPage /></AppLayout>} />
        <Route path="/contato" element={<AppLayout><ContatoPage /></AppLayout>} />
        <Route path="/politica-de-privacidade" element={<AppLayout><PoliticaPrivacidadePage /></AppLayout>} />
        <Route path="/termos-de-uso" element={<AppLayout><TermosUsoPage /></AppLayout>} />
        <Route path="/cote-finance-ai" element={<AppLayout><CoteFinanceAIPage /></AppLayout>} />
        <Route path="/motion-hero" element={<AppLayout><MotionHeroPage /></AppLayout>} />

        <Route
          path="/comparar"
          element={
            <AppLayout>
              <SeoProgrammaticPage mode="static" pagePath="/comparar" />
            </AppLayout>
          }
        />
        <Route
          path="/bancos"
          element={
            <AppLayout>
              <SeoProgrammaticPage mode="static" pagePath="/bancos" />
            </AppLayout>
          }
        />

        {reservedSeoStaticPaths
          .filter((path) => !['/comparar', '/bancos'].includes(path))
          .map((path) => (
            <Route
              key={`seo-static-${path}`}
              path={path}
              element={
                <AppLayout>
                  <SeoProgrammaticPage mode="static" pagePath={path} />
                </AppLayout>
              }
            />
          ))}

        <Route
          path="/comparar/:comparisonSlug"
          element={
            <AppLayout>
              <SeoProgrammaticPage mode="compare" />
            </AppLayout>
          }
        />
        <Route
          path="/banco/:bankSlug"
          element={
            <AppLayout>
              <SeoProgrammaticPage mode="bank" />
            </AppLayout>
          }
        />
        <Route
          path="/cartao/:cardSlug"
          element={
            <AppLayout>
              <SeoProgrammaticPage mode="card" />
            </AppLayout>
          }
        />
        <Route
          path="/blog/:articleSlug"
          element={
            <AppLayout>
              <BlogBoundary>
                <BlogArticlePage />
              </BlogBoundary>
            </AppLayout>
          }
        />

        <Route path="/admin/login" element={<AdminAuthGuard />} />
        <Route path="/admin" element={<AdminRoute title="Dashboard"><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/offers" element={<AdminRoute title="Offer Management"><AdminOffersPage /></AdminRoute>} />
        <Route path="/admin/banks" element={<AdminRoute title="Bank Management"><AdminBanksPage /></AdminRoute>} />
        <Route path="/admin/partners" element={<AdminRoute title="Partner Management"><AdminPartnersPage /></AdminRoute>} />
        <Route path="/admin/articles" element={<AdminRoute title="Article Management"><AdminArticlesPage /></AdminRoute>} />
        <Route path="/admin/seo-pages" element={<AdminRoute title="SEO Page Management"><AdminSeoPagesPage /></AdminRoute>} />
        <Route path="/admin/leads" element={<AdminRoute title="Lead Management"><AdminLeadsPage /></AdminRoute>} />
        <Route path="/admin/testimonials" element={<AdminRoute title="Testimonials"><AdminTestimonialsPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute title="Settings"><AdminSettingsPage /></AdminRoute>} />

        {seoPages.filter((page) => !shouldSkipSeedSeoPage(page.path)).map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              <AppLayout>
                <SeoLandingPage
                  title={page.title}
                  description={page.description}
                  heading={page.heroCopy || page.heading}
                  content={Array.isArray(page.content) ? page.content : [page.description].filter(Boolean)}
                  type={page.type}
                />
              </AppLayout>
            }
          />
        ))}

        {seoFallbackPaths.map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <AppLayout>
                <SeoLandingPage
                  title="Conteúdo especializado - Cote Juros"
                  description="Encontre a melhor oferta financeira para o seu perfil. Compare taxas e economize."
                  heading="Descubra a melhor opção para você"
                  content={[
                    'A Cote Juros analisa dezenas de instituições financeiras para entregar a melhor oferta para o seu bolso.',
                    'Comparamos taxas, prazos e condições para que você tome a melhor decisão de forma gratuita.'
                  ]}
                  type="all"
                />
              </AppLayout>
            }
          />
        ))}

        <Route
          path="*"
          element={
            <AppLayout>
              <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                <h1 className="mb-4 text-foreground">Página não encontrada</h1>
                <p className="mb-8 max-w-xl text-lg text-muted-foreground">
                  A página que você está procurando não existe ou foi movida.
                </p>
                <a href="/" className="font-semibold text-foreground hover:underline">
                  Voltar para o início
                </a>
              </div>
            </AppLayout>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;

