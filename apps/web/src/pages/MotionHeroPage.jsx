
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Activity, Shield, Zap, Globe, Lock, Smartphone } from 'lucide-react';

function MotionHeroPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <>
      <Helmet>
        <title>Experiência Premium - Cote Juros</title>
      </Helmet>

      {/* Animated Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-fintech-bg">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.08),transparent_40%)]" />
        
        {/* Fluid SVG Shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-full h-full opacity-30">
            <motion.path 
              d="M0,50 C20,60 40,40 60,50 C80,60 100,40 100,50 L100,100 L0,100 Z" 
              fill="rgba(37,99,235,0.08)"
              animate={{ d: ["M0,50 C20,60 40,40 60,50 C80,60 100,40 100,50 L100,100 L0,100 Z", "M0,50 C20,40 40,60 60,40 C80,60 100,40 100,50 L100,100 L0,100 Z"] }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </motion.svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto">
            <motion.h1 variants={itemVariants} className="text-foreground mb-6">
              O futuro do crédito é agora.
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-600 mb-10 font-medium">
              Velocidade, segurança e as melhores taxas do mercado em uma única plataforma.
            </motion.p>
            <motion.div variants={itemVariants}>
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl gradient-fintech-hover text-white shadow-premium">
                Começar agora <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: Activity, title: 'Análise em Tempo Real' },
              { icon: Shield, title: 'Segurança Bancária' },
              { icon: Zap, title: 'Aprovação Expressa' },
              { icon: Globe, title: '100% Digital' },
              { icon: Lock, title: 'Privacidade Total' },
              { icon: Smartphone, title: 'App Integrado' }
            ].map((f, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="card-premium bg-card border-border h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl mb-3">{f.title}</h3>
                    <p className="text-muted-foreground">Tecnologia de ponta para garantir a melhor experiência financeira possível.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default MotionHeroPage;
