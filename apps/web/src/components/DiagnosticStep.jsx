
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function DiagnosticStep({ stepNumber, totalSteps, title, description, children }) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="secondary" className="text-sm">
            Etapa {stepNumber} de {totalSteps}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-semibold text-balance">{title}</CardTitle>
        {description && <CardDescription className="text-base">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export default DiagnosticStep;
