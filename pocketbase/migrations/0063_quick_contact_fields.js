/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('activities')

    // Contato rápido (botão fixo "+ Contato rápido"):
    // quick_contact marca atividades criadas pelo botão (painel "Contatos a retornar");
    // contact_phone guarda o telefone/observação informado no formulário de 3 campos.
    if (!col.fields.getByName('quick_contact')) {
      col.fields.add(new TextField({ name: 'quick_contact' }))
    }
    if (!col.fields.getByName('contact_phone')) {
      col.fields.add(new TextField({ name: 'contact_phone' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('activities')
    for (const name of ['quick_contact', 'contact_phone']) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
