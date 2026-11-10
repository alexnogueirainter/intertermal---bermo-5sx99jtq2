/// <reference path="../pb_data/types.d.ts" />
// 0071 — Inspeção de Purgadores (VKP) da Visita a Campo.
// Coleção NOVA: nada é alterado nas coleções existentes.
// As fotos/vídeos dos purgadores reutilizam a coleção field_visit_media (rota idempotente
// /backend/v1/field-visits/media/upload) — aqui fica só o JSON da inspeção com as referências.
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('steam_trap_inspections')
    } catch (_) {
      const collection = new Collection({
        name: 'steam_trap_inspections',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'client_visit_id', type: 'text', required: true }, // id da visita (celular)
          { name: 'seller_token', type: 'text' }, // token do vendedor (modo link seguro)
          { name: 'status', type: 'text' }, // rascunho | concluida
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_steam_trap_visit ON steam_trap_inspections (client_visit_id)'],
      })
      app.save(collection)

      // Campo JSON com o conteúdo completo (contexto, achados, purgadores, melhorias, conclusão)
      const col = app.findCollectionByNameOrId('steam_trap_inspections')
      col.fields.add(
        new JSONField({
          name: 'data',
          required: true,
          maxSize: 15728640,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('steam_trap_inspections')
      app.delete(col)
    } catch (_) {}
  },
)
