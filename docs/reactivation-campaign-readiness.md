# Reactivation Campaign Readiness

## Finalidade

A campanha de reativacao tem a finalidade de convidar leads antigos da Cote Juros a atualizarem o interesse em receber opcoes de credito. A comunicacao deve ser limitada a essa finalidade e nao deve ser usada como campanha promocional generica sem nova avaliacao juridica/comercial.

## Origem dos leads

Somente leads originados de bases internas identificaveis da Cote Juros podem entrar na segmentacao. A origem precisa estar registrada no lote, planilha ou `originalPayload`, com identificador de campanha/importacao.

Nao assumir consentimento inexistente. Se a base legal nao estiver documentada para um lote, o lote deve permanecer fora da campanha real.

## Quem pode receber

Um lead so pode receber email se todos os criterios abaixo forem verdadeiros:

- email valido;
- token de reativacao ativo;
- status operacional elegivel;
- sem `consentRevokedAt`;
- sem `tokenRevokedAt`;
- sem opt-out registrado;
- sem supressao local;
- sem bounce/spam/unsubscribe anterior;
- origem confiavel e documentada;
- dentro do limite de lote e janela de envio aprovados.

## Regras de exclusao

Excluir antes de qualquer envio real:

- leads com status `revoked`, `suppressed` ou `rejected`;
- `emailStatus` terminal, incluindo `unsubscribed`, `suppressed`, `bounce`, `bounced`, `spam_reported`, `invalid_email` ou `completed`;
- leads presentes em `reactivation_suppressions`;
- leads sem token ou URL de reativacao;
- leads com email invalido;
- leads sem origem/base legal documentada.

## Opt-out

Todo email deve conter link de descadastro visivel no corpo e header `List-Unsubscribe`. O descadastro deve registrar supressao local com escopo `unsubscribe_email` e impedir novos envios.

## Retencao e logs

Logs de envio devem guardar somente o necessario para auditoria operacional:

- provider;
- messageId;
- status/evento;
- email mascarado/hash;
- campanha/lote/sequencia;
- timestamps.

Nao registrar API keys, conteudo completo de email, CPF, telefone ou email completo em logs operacionais.

## Governanca de GO

Antes de liberar campanha real:

- SPF/DKIM/DMARC validados;
- webhook Brevo configurado e testado;
- base legal do lote aprovada;
- dry-run do lote aprovado;
- descadastro validado;
- limites de warm-up definidos;
- monitoramento de bounce, spam complaint, unsubscribe e delivery ativo.
