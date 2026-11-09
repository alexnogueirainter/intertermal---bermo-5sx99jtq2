/**
 * Hook: Contato rápido — ação "Virar oportunidade"
 * Route: POST /backend/v1/quick-contact/convert
 * Body: { activity_id }
 * - Recebe uma atividade de contato rápido (quick_contact = '1').
 * - Cria o cliente se não existir (busca pelo nome; completa o telefone se vazio).
 * - Cria o negócio na etapa Prospecção, se o cliente ainda não tiver um lá.
 * - Marca a atividade como concluída e vincula o deal.
 * - Idempotente: chamar de novo não duplica cliente nem negócio.
 */
routerAdd('POST', '/backend/v1/quick-contact/convert', (e) => {
  const body = e.requestInfo().body || {}
  const activityId = String(body.activity_id || '').trim()
  if (!activityId) return e.json(400, { ok: false, error: 'activity_id_obrigatorio' })

  let act = null
  try {
    act = $app.findFirstRecordByFilter('activities', 'id = {:a}', { a: activityId })
  } catch (_) {
    act = null
  }
  if (!act) return e.json(404, { ok: false, error: 'atividade_nao_encontrada' })

  if (String(act.get('quick_contact') || '') !== '1') {
    return e.json(400, { ok: false, error: 'nao_e_contato_rapido' })
  }
  if (String(act.get('status') || '') === 'cancelled') {
    return e.json(400, { ok: false, error: 'contato_descartado' })
  }

  const name = String(act.get('title') || '').trim()
  const company = String(act.get('client_name') || '').trim()
  const phone = String(act.get('contact_phone') || '').trim()
  if (!name) return e.json(400, { ok: false, error: 'contato_sem_nome' })

  // Cliente: reusa pelo nome exato; se existir, completa o telefone que falta
  let client = null
  try {
    client = $app.findFirstRecordByFilter('clients', 'name = {:n}', { n: name })
  } catch (_) {
    client = null
  }

  let clientId = ''
  let createdClient = false
  if (client) {
    clientId = client.id
    if (phone && !String(client.get('phone') || '')) {
      client.set('phone', phone)
      $app.save(client)
    }
  } else {
    const clientsCol = $app.findCollectionByNameOrId('clients')
    client = new Record(clientsCol)
    client.set('name', name)
    if (company && company !== name) client.set('company_name', company)
    if (phone) client.set('phone', phone)
    client.set('status', 'lead')
    $app.save(client)
    clientId = client.id
    createdClient = true
  }

  // Negócio na etapa Prospecção (evita duplicado para o mesmo cliente)
  let deal = null
  try {
    deal = $app.findFirstRecordByFilter('deals', 'client_id = {:c} && stage = {:s}', {
      c: clientId,
      s: 'prospecting',
    })
  } catch (_) {
    deal = null
  }

  let dealId = ''
  let createdDeal = false
  if (deal) {
    dealId = deal.id
  } else {
    const dealsCol = $app.findCollectionByNameOrId('deals')
    deal = new Record(dealsCol)
    deal.set('title', 'Retorno de contato — ' + name)
    deal.set('client_id', clientId)
    deal.set('client_name', name)
    deal.set('value', 0)
    deal.set('stage', 'prospecting')
    deal.set('probability', 10)
    deal.set('priority', 'medium')
    deal.set('notes', 'Criado pelo contato rápido. Telefone/obs: ' + (phone || 'não informado'))
    $app.save(deal)
    dealId = deal.id
    createdDeal = true
  }

  // Atividade: concluída e vinculada ao negócio
  act.set('status', 'completed')
  act.set('outcome', 'Convertido em oportunidade')
  act.set('deal_id', dealId)
  $app.save(act)

  console.log(
    '[contato-rapido] Convertido | cliente=' +
      clientId +
      ' | deal=' +
      dealId +
      ' | novo_cliente=' +
      createdClient +
      ' | novo_deal=' +
      createdDeal,
  )

  return e.json(200, {
    ok: true,
    client_id: clientId,
    deal_id: dealId,
    created_client: createdClient,
    created_deal: createdDeal,
  })
})
