
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

function CreditCardCard({ card }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-balance">{card.nome}</CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Anuidade</p>
            <p className="text-sm font-medium font-variant-tabular">{card.anuidade}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Limite inicial</p>
            <p className="text-sm font-medium font-variant-tabular">{card.limiteInicial}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-muted-foreground mb-2">Benefícios</p>
        <div className="space-y-2">
          {card.beneficios.map((beneficio, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{beneficio}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full transition-all duration-200 active:scale-[0.98]">
          Solicitar cartão
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CreditCardCard;
