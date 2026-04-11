
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

function OfferCard({ offer, isBest }) {
  return (
    <Card className={`h-full flex flex-col ${isBest ? 'ring-2 ring-primary/30 shadow-[var(--shadow-md)] scale-105' : 'shadow-[var(--shadow-sm)]'} transition-all duration-200`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg font-semibold text-balance">{offer.banco}</CardTitle>
          {isBest && (
            <Badge className="bg-primary text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Melhor oferta
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{offer.tipo}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taxa de juros</p>
            <p className="text-2xl font-bold text-primary font-variant-tabular">{offer.taxa}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor aprovado</p>
              <p className="text-sm font-medium font-variant-tabular">R$ {offer.valor.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prazo</p>
              <p className="text-sm font-medium">{offer.prazo}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Parcela mensal</p>
            <p className="text-lg font-semibold font-variant-tabular">R$ {offer.parcela.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className={`w-full transition-all duration-200 active:scale-[0.98] ${isBest ? 'bg-primary text-white border-0 hover:bg-primary-hover' : ''}`}>
          Solicitar oferta
        </Button>
      </CardFooter>
    </Card>
  );
}

export default OfferCard;
