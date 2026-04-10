
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function FinancingCard({ financing }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-balance">{financing.tipo}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taxa média</p>
            <p className="text-2xl font-bold text-primary font-variant-tabular">{financing.taxaMedia}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Entrada mínima</p>
              <p className="text-sm font-medium font-variant-tabular">{financing.entradaMinima}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prazo máximo</p>
              <p className="text-sm font-medium">{financing.prazoMaximo}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full transition-all duration-200 active:scale-[0.98]">
          Simular financiamento
        </Button>
      </CardFooter>
    </Card>
  );
}

export default FinancingCard;
