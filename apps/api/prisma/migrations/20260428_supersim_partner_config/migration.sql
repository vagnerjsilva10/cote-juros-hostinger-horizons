INSERT INTO "partner_configs" (
  "id",
  "name",
  "slug",
  "integration_type",
  "tracking_link",
  "product_types",
  "status",
  "health_status",
  "priority",
  "weight",
  "metadata",
  "created_at",
  "updated_at"
)
VALUES (
  'partner_supersim',
  'SuperSim',
  'supersim',
  'tracking_link',
  'https://susim.co/XQLX5t8rSqYxaWnPd7CQaw==',
  ARRAY['loan']::"ProductType"[],
  'active',
  'healthy',
  100,
  1,
  '{
    "type": "affiliate_link",
    "description": "Opcao de emprestimo pessoal online para comparar condicoes conforme seu perfil.",
    "highlights": [
      "Perfil com restricao pode ser considerado",
      "Fluxo online",
      "Condicoes sujeitas ao parceiro"
    ],
    "ctaText": "Ver condicoes",
    "eventType": "click_partner_supersim"
  }'::jsonb,
  now(),
  now()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "integration_type" = EXCLUDED."integration_type",
  "tracking_link" = EXCLUDED."tracking_link",
  "product_types" = EXCLUDED."product_types",
  "status" = EXCLUDED."status",
  "health_status" = EXCLUDED."health_status",
  "priority" = EXCLUDED."priority",
  "weight" = EXCLUDED."weight",
  "metadata" = EXCLUDED."metadata",
  "updated_at" = now();
