
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function LoanCard({ loan }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg font-semibold text-balance">{loan.banco}</CardTitle>
          <Badge variant="secondary" className="font-variant-tabular">{loan.taxaJuros}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{loan.tipo}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor disponível</p>
            <p className="text-sm font-medium font-variant-tabular">
              R$ {loan.valorMinimo.toLocaleString('pt-BR')} - R$ {loan.valorMaximo.toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Prazo</p>
            <p className="text-sm font-medium">{loan.prazo}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full transition-all duration-200 active:scale-[0.98]">
          Simular agora
        </Button>
      </CardFooter>
    </Card>
  );
}

export default LoanCard;
