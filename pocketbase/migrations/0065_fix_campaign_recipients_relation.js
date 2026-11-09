/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // campaign_recipients: troca relation 'campaign' (aponta p/ deals, errado) pelo campo
    // texto campaign_id. Relation não permite remapear collectionId — remove e recria.
    const col = app.findCollectionByNameOrId('campaign_recipients')

    if (col.fields.getByName('campaign')) {
      col.fields.removeByName('campaign')
    }
    if (!col.fields.getByName('campaign_id')) {
      col.fields.add(new TextField({ name: 'campaign_id', required: true }))
    }
    // O índice idx_campaign_recipients_campaign (coluna campaign) morre com a relation:
    // PocketBase revalida os índices da coleção ao salvar — troca pelo índice do campo novo.
    const idx = col.indexes || []
    const cleaned = []
    for (const sql of idx) {
      const s = String(sql)
      if (s.indexOf('(campaign)') !== -1) continue
      if (s.indexOf('idx_campaign_recipients_campaign ') !== -1) continue
      cleaned.push(s)
    }
    cleaned.push(
      'CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients (campaign_id)',
    )
    col.indexes = cleaned
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('campaign_recipients')
    if (col.fields.getByName('campaign_id')) {
      col.fields.removeByName('campaign_id')
    }
    col.fields.add(
      new RelationField({
        name: 'campaign',
        collectionId: 'pbc_612317808',
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)
