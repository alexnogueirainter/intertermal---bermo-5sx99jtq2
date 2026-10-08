import { describe, it, expect } from 'vitest'
import pb from '@/lib/pocketbase/client'
import { compareAndMergeNameplateData, FORM_FIELD_DEFINITIONS } from './nameplate-reader'
import { createEmptyEquipment } from '@/types/field-visit'

describe('nameplate-reader: compareAndMergeNameplateData', () => {
  it('preenche apenas campos vazios sem alterar o que já foi digitado pelo técnico', () => {
    const eq = createEmptyEquipment('Equipamento 01')
    eq.model = 'BP60B INTERTERMAL DIGITADO'
    eq.service = '' // vazio
    eq.manufacturingNumber = '' // vazio

    const extracted = {
      manufacturer: 'BERMO',
      model: 'BP60B TRCPL1134-35HE',
      manufacturingNumber: '639.065',
      service: 'RESFRIAMENTO',
      designPressureBar: '10,00',
      testPressureBar: '13,00',
      designTempC: '165',
      pmtaMpa: '1,30',
      emptyWeightKg: '164,30',
      manufacturingYear: '2025',
      tighteningMaxA: '66',
      tighteningMinA: '70',
    }

    const res = compareAndMergeNameplateData(eq, extracted)

    // O modelo original NÃO deve ter sido substituído
    expect(res.mergedEquipment.model).toBe('BP60B INTERTERMAL DIGITADO')

    // Deve registrar a divergência no modelo
    expect(res.discrepancies.some((d) => d.fieldKey === 'model')).toBe(true)

    // Campos vazios devem ter sido preenchidos
    expect(res.mergedEquipment.service).toBe('RESFRIAMENTO')
    expect(res.mergedEquipment.manufacturingNumber).toBe('639.065')
    expect(res.mergedEquipment.designPressureBar).toBe('10,00')
    expect(res.mergedEquipment.testPressureBar).toBe('13,00')
    expect(res.mergedEquipment.designTempC).toBe('165')
    expect(res.mergedEquipment.pmtaMpa).toBe('1,30')
    expect(res.mergedEquipment.emptyWeightKg).toBe('164,30')
    expect(res.mergedEquipment.manufacturingYear).toBe('2025')
    expect(res.mergedEquipment.tighteningMaxA).toBe('66')
    expect(res.mergedEquipment.tighteningMinA).toBe('70')

    // Verificar itens em autoFilled
    expect(res.autoFilled.some((f) => f.fieldKey === 'service')).toBe(true)
    expect(res.autoFilled.some((f) => f.fieldKey === 'manufacturingNumber')).toBe(true)
  })

  it('cria novos campos dinâmicos quando a foto traz informações que não pertencem ao formulário padrão', () => {
    const eq = createEmptyEquipment('Equipamento 01')
    const extracted = {
      manufacturer: 'BERMO',
      model: 'BP 60',
      extraFields: [
        { label: 'Classe de Pressão', value: 'PN 16' },
        { label: 'Fluido da Placa', value: 'Caldo de Cana' },
        { label: 'Norma da Placa', value: 'ASME VIII Div 1' },
      ],
    }

    const res = compareAndMergeNameplateData(eq, extracted)

    expect(res.newCustomFields.length).toBe(3)
    expect(res.mergedEquipment.customFields?.length).toBe(3)
    expect(res.mergedEquipment.customFields?.[0].label).toBe('Classe de Pressão')
    expect(res.mergedEquipment.customFields?.[0].value).toBe('PN 16')
    expect(res.mergedEquipment.customFields?.[1].label).toBe('Fluido da Placa')
    expect(res.mergedEquipment.customFields?.[2].label).toBe('Norma da Placa')
  })

  it('sinaliza campos não identificados na foto', () => {
    const eq = createEmptyEquipment('Equipamento 01')
    const extracted = {
      manufacturer: 'BERMO',
      model: 'BP 60',
    }

    const res = compareAndMergeNameplateData(eq, extracted)
    // tag, service, etc não foram preenchidos nem pelo técnico nem pela foto
    expect(res.unidentifiedFields.some((u) => u.fieldKey === 'service')).toBe(true)
    expect(res.unidentifiedFields.some((u) => u.fieldKey === 'tag')).toBe(true)
  })

  it('faz chamada real ao endpoint de leitura de plaqueta com texto OCR cliente da BERMO', async () => {
    const backendUrl =
      import.meta.env.VITE_POCKETBASE_URL ||
      'https://crm-comercial-sofisticado-00224.shrd00.internal.goskip.dev'

    const sampleBermoOcrText = `
      BERMO / ALFA LAVAL
      MODEL: BP 60 B TRCPL1134-35HE
      MANUF. NO: 639.065
      DESIGN PRESSURE: 10/13 bar
      TEMP: 99/-10 C
      PMTA: 1.13 MPa
      EMPTY WEIGHT: 265 kgf
      YEAR: 2025
      a max: 2.90 mm
      a min: 2.25 mm
      SERVICE: RESFRIAMENTO
    `

    const res = await fetch(`${backendUrl}/backend/v1/field-visits/equipment/read-nameplate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientOcrText: sampleBermoOcrText,
        context: 'Equipamento de teste unitário BERMO',
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    console.log('RESPOSTA READ-NAMEPLATE COM TEXTO OCR:', JSON.stringify(json, null, 2))

    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
    expect(json.data.manufacturer).toMatch(/BERMO/i)
    expect(json.data.model).toMatch(/BP\s*60/i)
    expect(json.data.manufacturingNumber).toContain('639.065')
  })

  it('reproduz com exatidão a extração da foto de teste enviada pelo usuário (BERMO BP 60)', () => {
    const eq = createEmptyEquipment('Equipamento 01')
    const extractedReferencePlate = {
      manufacturer: 'BERMO',
      model: 'BP60B TRCPL1134-35HE',
      manufacturingNumber: '639.065',
      serialNumber: '639.065',
      service: 'RESFRIAMENTO',
      tag: '',
      designPressureBar: '10,00',
      testPressureBar: '13,00',
      designTempC: '165',
      pmtaMpa: '1,30',
      emptyWeightKg: '164,30',
      manufacturingYear: '2025',
      tighteningMaxA: '66',
      tighteningMinA: '70',
      extraFields: [
        { label: 'Grupo Fabricante', value: 'ARMATUREN GROUP' },
        {
          label: 'Razão Social Fabricante',
          value: 'BERMO VÁLVULAS E EQUIPAMENTOS INDUSTRIAIS LTDA',
        },
        { label: 'Contato Fabricante', value: '47 2123-4444 - Blumenau / SC' },
      ],
    }

    const res = compareAndMergeNameplateData(eq, extractedReferencePlate, 'att-test-123')

    expect(res.mergedEquipment.manufacturer).toBe('BERMO')
    expect(res.mergedEquipment.model).toBe('BP60B TRCPL1134-35HE')
    expect(res.mergedEquipment.manufacturingNumber).toBe('639.065')
    expect(res.mergedEquipment.service).toBe('RESFRIAMENTO')
    expect(res.mergedEquipment.designPressureBar).toBe('10,00')
    expect(res.mergedEquipment.testPressureBar).toBe('13,00')
    expect(res.mergedEquipment.designTempC).toBe('165')
    expect(res.mergedEquipment.pmtaMpa).toBe('1,30')
    expect(res.mergedEquipment.emptyWeightKg).toBe('164,30')
    expect(res.mergedEquipment.manufacturingYear).toBe('2025')
    expect(res.mergedEquipment.tighteningMaxA).toBe('66')
    expect(res.mergedEquipment.tighteningMinA).toBe('70')

    // 3 campos complementares dinâmicos adicionados
    expect(res.mergedEquipment.customFields?.length).toBe(3)
    expect(res.mergedEquipment.nameplateOcrData?.evidenceAttachmentId).toBe('att-test-123')
  })
})
