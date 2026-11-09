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
    app.save(col)

    // Índice da relation antiga sai; índice do campo novo entra
    app.db().newQuery('DROP INDEX IF EXISTS idx_campaign_recipients_campaign').execute()
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients (campaign_id)',
      )
      .execute()
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
