/// <reference path="../pb_data/types.d.ts" />
// 0073 — Checklist Digital de Manutenção (família: trocador, válvulas, purgadores).
// Coleções NOVAS: nada é alterado nas coleções existentes.
// - os_checklists: 1 registro por execução de checklist (respostas, identificação, veredito).
// - os_checklist_media: fotos com marca d'água (mesmo padrão de field_visit_media,
//   idempotente por client_media_id; o arquivo mora no servidor).
// Os ids de OS são TEXT (relation não remapeia collectionId — padrão já provado).
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('os_checklists')
    } catch (_) {
      const collection = new Collection({
        name: 'os_checklists',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'service_order_id', type: 'text' }, // id da OS (service_orders)
          { name: 'os_number', type: 'text' }, // número legível da OS (OS-2026-XXXX)
          { name: 'template', type: 'text' }, // trocador | valvulas | purgadores
          { name: 'client_id', type: 'text' },
          { name: 'client_name', type: 'text' },
          { name: 'technician_name', type: 'text' }, // responsável em campo
          { name: 'status', type: 'text' }, // rascunho | concluido
          { name: 'conformity_pct', type: 'number', onlyInt: false },
          { name: 'verdict', type: 'text' }, // aprovado | ressalvas | reprovado | pendente
          { name: 'economia_ano', type: 'number', onlyInt: false }, // R$/ano recuperados (purgador)
          { name: 'completed_at', type: 'text' }, // ISO quando concluído
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_os_checklists_order ON os_checklists (service_order_id)',
          'CREATE INDEX idx_os_checklists_status ON os_checklists (status)',
          'CREATE INDEX idx_os_checklists_template ON os_checklists (template)',
        ],
      })
      app.save(collection)

      // Campos JSON com o conteúdo completo (adicionados após a criação, padrão 0071)
      const col = app.findCollectionByNameOrId('os_checklists')
      col.fields.add(
        new JSONField({
          name: 'ident', // identificação pré-preenchida da OS + medidas de campo
          required: false,
          maxSize: 2097152,
        }),
      )
      col.fields.add(
        new JSONField({
          name: 'answers', // { itemNum: { status: ok|nok|na|null, obs: string } }
          required: false,
          maxSize: 15728640,
        }),
      )
      col.fields.add(
        new JSONField({
          name: 'texts', // seções de texto do relatório por template
          required: false,
          maxSize: 2097152,
        }),
      )
      app.save(col)
    }

    try {
      app.findCollectionByNameOrId('os_checklist_media')
    } catch (_) {
      const collection = new Collection({
        name: 'os_checklist_media',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'client_media_id', type: 'text', required: true }, // idempotência no reenvio
          { name: 'kind', type: 'text' }, // image | video
          { name: 'original_name', type: 'text' },
          { name: 'size', type: 'number', onlyInt: false },
          { name: 'checklist_id', type: 'text' }, // id do registro em os_checklists
          { name: 'item_numero', type: 'number', onlyInt: true }, // item do checklist (0 = geral)
          { name: 'etapa', type: 'number', onlyInt: true }, // etapa do checklist (0 = geral)
          { name: 'legenda', type: 'text' },
          { name: 'selecionada', type: 'bool' }, // entra no relatório
          { name: 'ordem', type: 'number', onlyInt: true }, // ordem na galeria
          {
            name: 'file',
            type: 'file',
            required: true,
            maxSize: 52428800,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_os_checklist_media_client ON os_checklist_media (client_media_id)',
          'CREATE INDEX idx_os_checklist_media_checklist ON os_checklist_media (checklist_id)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('os_checklist_media')
      app.delete(col)
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('os_checklists')
      app.delete(col)
    } catch (_) {}
  },
)
