/**
 * Hook: Lista os checklists para o dashboard gerencial (aba Execução em Campo).
 * Route (GET, autenticada): /backend/v1/checklists/list
 * - Devolve todos os checklists (rascunho e concluído) com OS, cliente, técnico,
 *   veredito, conformidade e economia — base dos KPIs da sub-aba.
 * - Leve: sem answers/texts (só metadados). O detalhe vai pelo open (token) ou
 *   por leitura direta da coleção no frontend autenticado.
 */
routerAdd(
  'GET',
  '/backend/v1/checklists/list',
  (e) => {
    const recs = $app.findRecordsByFilter('os_checklists', 'id != ""', '-updated', 500, 0)

    const out = []
    for (const r of recs) {
      out.push({
        id: r.id,
        service_order_id: String(r.get('service_order_id') || ''),
        os_number: String(r.get('os_number') || ''),
        template: String(r.get('template') || ''),
        client_name: String(r.get('client_name') || ''),
        technician_name: String(r.get('technician_name') || ''),
        status: String(r.get('status') || ''),
        conformity_pct: Number(r.get('conformity_pct') || 0),
        verdict: String(r.get('verdict') || ''),
        equipment_tag: String(r.get('equipment_tag') || ''),
        equipment_label: String(r.get('equipment_label') || ''),
        economia_ano: Number(r.get('economia_ano') || 0),
        completed_at: String(r.get('completed_at') || ''),
        created: String(r.get('created') || ''),
        updated: String(r.get('updated') || ''),
      })
    }

    return e.json(200, { ok: true, checklists: out })
  },
  $apis.requireAuth(),
)
