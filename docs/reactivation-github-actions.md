# Automacao da reativacao via GitHub Actions

Este runbook liga a operacao sem VPS e sem n8n. Os workflows rodam scripts reais do backend em `apps/api` contra a API de producao, Google Sheets e SendGrid.

## Workflows

- `Reactivation - Prepare and Import`
  - Agenda: segunda a sexta, 09:00 BRT.
  - Faz: pega novos leads da aba `IMPORT_AUTOMACAO`, adiciona ate `REACTIVATION_QUEUE_LIMIT` na `leads_queue` e importa na API.

- `Reactivation - Import Queued Leads`
  - Agenda: a cada 15 minutos.
  - Faz: importa qualquer linha com `status=queued` na aba `leads_queue`.

- `Reactivation - Send Emails`
  - Agenda: segunda a sexta, 09:30 ate 17:30 BRT.
  - Faz: envia a proxima onda de emails dos leads importados, respeitando supressao e limites.

- `Reactivation - Retry Deliveries`
  - Agenda: a cada 15 minutos.
  - Faz: chama retry de entregas pendentes/vencidas na API.

- `Reactivation - Sync KPIs`
  - Agenda: a cada 1 hora.
  - Faz: salva KPIs do batch na aba `kpis_daily`.

## Secrets obrigatorios

Configure em GitHub > Settings > Secrets and variables > Actions > Secrets:

- `COTE_API_TOKEN`
- `GOOGLE_SHEETS_CREDENTIALS_JSON`
- `SENDGRID_API_KEY`

Com GitHub CLI, rode a partir da raiz do repo:

```powershell
cd C:\dev\cote-juros-hostinger-horizons

gh secret set COTE_API_TOKEN --body "$env:COTE_API_TOKEN"
gh secret set GOOGLE_SHEETS_CREDENTIALS_JSON --body "$env:GOOGLE_SHEETS_CREDENTIALS_JSON"
gh secret set SENDGRID_API_KEY --body "$env:SENDGRID_API_KEY"
```

Se as variaveis estiverem apenas no arquivo `apps/api/.env`, carregue antes:

```powershell
cd C:\dev\cote-juros-hostinger-horizons

Get-Content .\apps\api\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}

gh secret set COTE_API_TOKEN --body "$env:COTE_API_TOKEN"
gh secret set GOOGLE_SHEETS_CREDENTIALS_JSON --body "$env:GOOGLE_SHEETS_CREDENTIALS_JSON"
gh secret set SENDGRID_API_KEY --body "$env:SENDGRID_API_KEY"
```

## Variables recomendadas

Configure em GitHub > Settings > Secrets and variables > Actions > Variables:

- `COTE_API_BASE_URL=https://api.cotejuros.com.br`
- `GOOGLE_SHEETS_REACTIVATION_ID=16rV2fuSxVCSkmJYOijmNZF5sP1sQIR9ct9r97Ti-vvY`
- `REACTIVATION_BASE_URL=https://www.cotejuros.com.br`
- `REACTIVATION_BATCH_ID=piloto-5-2026-04-17`
- `REACTIVATION_QUEUE_LIMIT=5`
- `REACTIVATION_EMAIL_BATCH_SIZE=5`
- `REACTIVATION_EMAIL_DAILY_LIMIT=5`
- `REACTIVATION_EMAIL_DRY_RUN=false`
- `REACTIVATION_EMAIL_SEND_DRY_RUN_ROWS=false`
- `SENDGRID_FROM_EMAIL=noreply@em.cotejuros.com.br`
- `SENDGRID_FROM_NAME=Cote Juros`
- `SENDGRID_REPLY_TO=noreply@em.cotejuros.com.br`

Com GitHub CLI:

```powershell
cd C:\dev\cote-juros-hostinger-horizons

gh variable set COTE_API_BASE_URL --body "https://api.cotejuros.com.br"
gh variable set GOOGLE_SHEETS_REACTIVATION_ID --body "16rV2fuSxVCSkmJYOijmNZF5sP1sQIR9ct9r97Ti-vvY"
gh variable set REACTIVATION_BASE_URL --body "https://www.cotejuros.com.br"
gh variable set REACTIVATION_BATCH_ID --body "piloto-5-2026-04-17"
gh variable set REACTIVATION_QUEUE_LIMIT --body "5"
gh variable set REACTIVATION_EMAIL_BATCH_SIZE --body "5"
gh variable set REACTIVATION_EMAIL_DAILY_LIMIT --body "5"
gh variable set REACTIVATION_EMAIL_DRY_RUN --body "false"
gh variable set REACTIVATION_EMAIL_SEND_DRY_RUN_ROWS --body "false"
gh variable set SENDGRID_FROM_EMAIL --body "noreply@em.cotejuros.com.br"
gh variable set SENDGRID_FROM_NAME --body "Cote Juros"
gh variable set SENDGRID_REPLY_TO --body "noreply@em.cotejuros.com.br"
```

## Primeiro teste manual

Depois de commitar e fazer push dos workflows:

```powershell
cd C:\dev\cote-juros-hostinger-horizons

gh workflow run "Reactivation - Prepare and Import" -f prepare=true -f limit=1
gh run list --workflow "Reactivation - Prepare and Import" --limit 3
```

Se passar, rode um envio em dry-run:

```powershell
gh workflow run "Reactivation - Send Emails" -f batch_size=1 -f daily_limit=1 -f dry_run=true
gh run list --workflow "Reactivation - Send Emails" --limit 3
```

So depois rode envio real manual pequeno:

```powershell
gh workflow run "Reactivation - Send Emails" -f batch_size=1 -f daily_limit=1 -f dry_run=false
```

## Corte do motor local

Quando o GitHub Actions estiver validado, pare o scheduler local para evitar duplicidade:

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'src/jobs/scheduler.js|jobs:start' -and $_.Name -ne 'powershell.exe' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## Regras de seguranca do piloto

- Mantenha `REACTIVATION_QUEUE_LIMIT=5` ate validar entregabilidade.
- Mantenha `REACTIVATION_EMAIL_DAILY_LIMIT=5` no primeiro dia.
- Suba para `20`, depois `50`, somente se abertura/clique e reclamacoes estiverem saudaveis.
- Nao rode scheduler local e GitHub Actions ao mesmo tempo.
- Rotacione qualquer segredo que aparecer em chat, logs ou print.
