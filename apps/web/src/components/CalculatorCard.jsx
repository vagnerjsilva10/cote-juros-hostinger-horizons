
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function CalculatorCard({ title, description, children, result }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-balance">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="space-y-4">
          {children}
        </div>
        {result && (
          <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Resultado</p>
            <div className="space-y-1">
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalculatorCard;
