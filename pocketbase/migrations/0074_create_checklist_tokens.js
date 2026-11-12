/// <reference path="../pb_data/types.d.ts" />
// 0074 — Tokens de acesso ao Checklist Digital (acesso RESTRICTO ao checklist).
// Coleção NOVA: nada é alterado nas coleções existentes.
// Mesmo modelo do field_visit_tokens: 1 token = 1 aparelho; amarra device_id no 1º uso.
// O token nasce ligado a UMA OS (checklist único) — o link abre só aquele checklist.
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('checklist_tokens')
    } catch (_) {
      const collection = new Collection({
        name: 'checklist_tokens',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'token', type: 'text', required: true }, // código do link /checklist?t=
          { name: 'service_order_id', type: 'text' }, // id da OS (TEXT — padrão provado)
          { name: 'os_number', type: 'text' }, // número legível
          { name: 'technician_name', type: 'text' }, // nome do técnico (mensagem do WhatsApp)
          { name: 'template', type: 'text' }, // trocador | valvulas | purgadores
          { name: 'device_id', type: 'text' }, // amarrado no 1º uso
          { name: 'device_ip', type: 'text' },
          { name: 'device_ua', type: 'text' },
          { name: 'bound_at', type: 'text' },
          { name: 'active', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_checklist_tokens_token ON checklist_tokens (token)',
          'CREATE INDEX idx_checklist_tokens_order ON checklist_tokens (service_order_id)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('checklist_tokens')
      app.delete(col)
    } catch (_) {}
  },
)
