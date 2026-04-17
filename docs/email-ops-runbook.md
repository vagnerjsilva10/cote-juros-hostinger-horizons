# Email Ops Runbook

## Autenticacao

Email Ops nao possui login proprio. A tela `/admin/email-ops` usa exclusivamente a sessao global do admin em `/api/admin/auth/session`.

As chamadas do modulo usam o namespace `/api/admin/email-ops/*`, protegido por permissoes `email_ops:view` para leitura e `email_ops:edit` para mutacao. A implementacao ainda reaproveita internamente servicos de reativacao, mas esse legado nao aparece na UX.

## Macroareas

- Visao geral: KPIs, campanhas e status operacional da regua.
- Conteudo: templates, editor, preview, variaveis e status publicado/ativo.
- Operacao: acoes manuais, busca por lead, timeline, reenvio, supressao, pausa e movimentacao de etapa.
- Infraestrutura: jobs, saude do fluxo, canvas visual e sincronizacao do fluxo padrao.

## Erros esperados

- Sessao expirada: redirecionamento pelo admin global ou mensagem de sessao expirada.
- Permissao ausente: acesso negado com referencia a `email_ops`.
- Provider sem configuracao: `EMAIL_PROVIDER_NOT_CONFIGURED`, exibido como "Provider de envio ainda nao configurado."
- Lead sem email: `EMAIL_OPS_LEAD_WITHOUT_EMAIL`.
- Estado vazio: campanhas, templates, jobs e fluxos sempre indicam proximo passo.

## Acoes criticas

Exigem confirmacao no browser:

- Reenvio manual.
- Pausar lead.
- Mover node.
- Forcar proxima etapa.
- Aplicar supressao.

As acoes exigem campos minimos antes de habilitar o botao.
