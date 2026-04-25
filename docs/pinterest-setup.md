# Pinterest setup

O token gerado no painel em modo Trial/Producao limitada nao publica Pins. Ele serve para leitura e normalmente vem limitado a escopos como `pins:read`, `boards:read` e `user_accounts:read`.

Para o pipeline publicar Pins automaticamente, o app precisa de Standard Access aprovado pelo Pinterest e o token OAuth precisa incluir:

```text
pins:read,pins:write,boards:read,boards:write,user_accounts:read
```

## Procedimento

1. No Pinterest Developers, envie o pedido de Standard Access com o video de demonstracao.
2. Depois da aprovacao, gere um novo OAuth token solicitando os escopos de leitura e escrita.
3. Atualize o Vercel Production:

```powershell
npx vercel env add PINTEREST_ACCESS_TOKEN production --value "NOVO_TOKEN" --yes --force
npx vercel env add PINTEREST_REQUIRED_SCOPES production --value "pins:read,pins:write,boards:read,boards:write,user_accounts:read" --yes --force
npx vercel env add PINTEREST_TOKEN_SCOPES production --value "pins:read,pins:write,boards:read,boards:write,user_accounts:read" --yes --force
```

`PINTEREST_TOKEN_SCOPES` deve refletir exatamente o campo `scope` retornado pelo OAuth do Pinterest. Quando esse campo nao estiver configurado, a API valida os escopos de leitura com chamadas seguras e bloqueia a publicacao por nao conseguir comprovar os escopos de escrita sem executar uma acao de escrita.

4. Faca redeploy da API para carregar o token novo:

```powershell
npx vercel deploy --prod --yes
```

5. Rode um teste controlado:

```powershell
curl.exe -H "Authorization: Bearer SEU_COTE_API_TOKEN" "https://api.cotejuros.com.br/api/internal/distribution/backfill?limit=1&force=true&trigger=pinterest-token-test"
```

Se faltar `pins:write` ou `boards:write`, o pipeline nao tenta publicar o Pin. O artigo e o Web Story continuam funcionando, e apenas o canal Pinterest fica marcado como `failed` com a mensagem:

```text
Pinterest token sem permissão de publicação. Gere um novo token após aprovação Standard Access com scopes pins:write e boards:write.
```
