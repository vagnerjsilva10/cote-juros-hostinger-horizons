import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ComparisonTable({ data, onSimulate }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Banco</TableHead>
            <TableHead>Tipo de empréstimo</TableHead>
            <TableHead>Taxa de juros</TableHead>
            <TableHead>Valor mínimo</TableHead>
            <TableHead>Valor máximo</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Nenhum resultado encontrado com os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.banco}</TableCell>
                <TableCell>{loan.tipo}</TableCell>
                <TableCell className="font-variant-tabular">{loan.taxaJuros}</TableCell>
                <TableCell className="font-variant-tabular">R$ {loan.valorMinimo.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="font-variant-tabular">R$ {loan.valorMaximo.toLocaleString('pt-BR')}</TableCell>
                <TableCell>{loan.prazo}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onSimulate(loan)}
                    className="transition-all duration-200 active:scale-[0.98]"
                  >
                    Simular
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ComparisonTable;
