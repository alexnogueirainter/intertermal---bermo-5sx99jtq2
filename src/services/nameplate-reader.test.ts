import { describe, it, expect } from 'vitest'
import {
  compareAndMergeNameplateData,
  normalizeNameplateNumeric,
  NameplateExtractedData,
} from './nameplate-reader'
import { EquipmentItem } from '@/types/field-visit'

describe('nameplate-reader service & BERMO identification pipeline', () => {
  const baseEquipment: EquipmentItem = {
    id: 'eq-test-123',
    name: 'Trocador de Calor Principal',
    model: '',
    serialNumber: '',
    manufacturer: '',
    plateCount: '',
    fluid1: '',
    fluid2: '',
    inletTemp: '',
    outletTemp: '',
    flowRate: '',
    installedLocation: 'Galpão 3',
    difficulty: 'Baixo',
    attachments: [],
    technicianNotes: '',
    customFields: [{ id: 'c1', label: 'Localização Setorial', value: 'Galpão 3' }],
  }

  it('normaliza valores numéricos removendo unidades de medida e convertendo ponto para vírgula', () => {
    expect(normalizeNameplateNumeric('10,00 bar')).toBe('10,00')
    expect(normalizeNameplateNumeric('1.13 MPa')).toBe('1,13')
    expect(normalizeNameplateNumeric('265 kgf')).toBe('265')
    expect(normalizeNameplateNumeric('165 °C')).toBe('165')
    expect(normalizeNameplateNumeric('66 mm')).toBe('66')
    expect(normalizeNameplateNumeric('')).toBe('')
    expect(normalizeNameplateNumeric(undefined)).toBe('')
  })

  it('(a) pipeline OCR -> estrutura com texto de plaqueta BERMO real (BP 60 B, nº 639.065, 10/13 bar, PMTA 1,13 MPa, ano 2025)', () => {
    // Simula os dados extraídos pelo agente e hook após correções de OCR de plaqueta BERMO real
    const bermoExtracted: NameplateExtractedData = {
      manufacturer: 'BERMO',
      model: 'BP 60 B TRCPL1134-35HE',
      manufacturingNumber: '639.065',
      serialNumber: '639.065',
      service: 'RESFRIAMENTO DE SALMOURA',
      tag: 'TC-01',
      designPressureBar: '10,00',
      testPressureBar: '13,00',
      designTempC: '165',
      pmtaMpa: '1,13',
      emptyWeightKg: '265',
      manufacturingYear: '2025',
      tighteningMaxA: '66',
      tighteningMinA: '70',
      plateCount: '64',
      fluid1: 'Salmoura',
      fluid2: 'Água industrial',
      thermalAreaM2: '18,5 m²',
      fabricationStandard: 'ASME VIII Div 1',
      connectionSize: 'DN 65 Flangeado',
      plateMaterial: 'AISI 316L',
      gasketMaterial: 'NBR Clip-on',
      extraFields: [
        { label: 'Área de Troca Térmica', value: '18,5 m²' },
        { label: 'Norma de Fabricação', value: 'ASME VIII Div 1' },
        { label: 'Conexões / Bocais', value: 'DN 65 Flangeado' },
        { label: 'Material das Placas', value: 'AISI 316L' },
        { label: 'Material das Gaxetas', value: 'NBR Clip-on' },
      ],
      rawTextExtracted:
        'BERMO VALVULAS E EQUIPAMENTOS INDUSTRIAIS LTDA\nBP 60 B\nNo. 639.065\nANO 2025\nPMTA 1,13 MPa\nPRESSAO PROJETO 10,00 bar TESTE 13,00 bar',
      summary: 'Plaqueta BERMO BP 60 B identificada com sucesso',
    }

    const result = compareAndMergeNameplateData(baseEquipment, bermoExtracted)

    // Preencheu campos vazios
    expect(result.mergedEquipment.manufacturer).toBe('BERMO')
    expect(result.mergedEquipment.model).toBe('BP 60 B TRCPL1134-35HE')
    expect(result.mergedEquipment.manufacturingNumber).toBe('639.065')
    expect(result.mergedEquipment.designPressureBar).toBe('10,00')
    expect(result.mergedEquipment.testPressureBar).toBe('13,00')
    expect(result.mergedEquipment.pmtaMpa).toBe('1,13')
    expect(result.mergedEquipment.manufacturingYear).toBe('2025')
    expect(result.mergedEquipment.emptyWeightKg).toBe('265')
    expect(result.mergedEquipment.tighteningMaxA).toBe('66')
    expect(result.mergedEquipment.tighteningMinA).toBe('70')

    // Preservou customFields pré-existentes e adicionou novos sem duplicação
    const customLabels = result.mergedEquipment.customFields?.map((c) => c.label)
    expect(customLabels).toContain('Localização Setorial')
    expect(customLabels).toContain('Área de Troca Térmica')
    expect(customLabels).toContain('Material das Placas')
    expect(customLabels).toContain('Material das Gaxetas')

    // Nenhuma discrepância pois o equipamento inicial estava com esses campos em branco
    expect(result.discrepancies.length).toBe(0)
    expect(result.autoFilled.length).toBeGreaterThan(5)
  })

  it('(b) aplicar num formulário com campos pré-preenchidos NÃO sobrescreve e gera divergências', () => {
    const preFilledEquipment: EquipmentItem = {
      ...baseEquipment,
      model: 'BP 50 A', // Digitado pelo técnico anteriormente
      manufacturingNumber: '100.999', // Digitado manualmente
      designPressureBar: '16,00', // Valor divergente da placa
      service: 'RESFRIAMENTO', // Valor coincidente
      tag: '', // Vazio, deve ser preenchido
    }

    const bermoExtracted: NameplateExtractedData = {
      manufacturer: 'BERMO',
      model: 'BP 60 B', // Diverge de 'BP 50 A'
      manufacturingNumber: '639.065', // Diverge de '100.999'
      service: 'RESFRIAMENTO', // Idêntico
      tag: 'TC-01', // Deve preencher
      designPressureBar: '10,00', // Diverge de '16,00'
      testPressureBar: '13,00', // Campo vazio, deve preencher
      pmtaMpa: '1,13', // Campo vazio, deve preencher
    }

    const result = compareAndMergeNameplateData(preFilledEquipment, bermoExtracted)

    // NÃO sobrescreve valores existentes
    expect(result.mergedEquipment.model).toBe('BP 50 A')
    expect(result.mergedEquipment.manufacturingNumber).toBe('100.999')
    expect(result.mergedEquipment.designPressureBar).toBe('16,00')
    expect(result.mergedEquipment.service).toBe('RESFRIAMENTO')

    // Preenche campo que estava vazio
    expect(result.mergedEquipment.tag).toBe('TC-01')
    expect(result.mergedEquipment.testPressureBar).toBe('13,00')
    expect(result.mergedEquipment.pmtaMpa).toBe('1,13')

    // Divergências registradas
    const discKeys = result.discrepancies.map((d) => d.fieldKey)
    expect(discKeys).toContain('model')
    expect(discKeys).toContain('manufacturingNumber')
    expect(discKeys).toContain('designPressureBar')
    expect(discKeys).not.toContain('service') // Não há divergência pois é igual
    expect(discKeys).not.toContain('tag') // Não há divergência pois estava vazio

    // Detalhes da divergência de modelo
    const modelDisc = result.discrepancies.find((d) => d.fieldKey === 'model')
    expect(modelDisc?.currentValue).toBe('BP 50 A')
    expect(modelDisc?.plateValue).toBe('BP 60 B')

    // As divergências devem ser salvas no objeto nameplateOcrData do equipamento
    expect(result.mergedEquipment.nameplateOcrData?.discrepancies).toEqual(result.discrepancies)
  })

  it('lida com formato com unidades coladas e corrige campos extras sem duplicar', () => {
    const eqWithCustom: EquipmentItem = {
      ...baseEquipment,
      customFields: [{ id: 'cf-1', label: 'Material das Placas', value: 'AISI 304' }],
    }

    const extracted: NameplateExtractedData = {
      emptyWeightKg: '265kgf',
      tighteningMaxA: '66mm',
      extraFields: [
        { label: 'Material das Placas', value: 'AISI 316L' }, // Já existe no customFields -> não deve duplicar
        { label: 'Área Térmica', value: '25 m²' }, // Novo -> deve adicionar
      ],
    }

    const result = compareAndMergeNameplateData(eqWithCustom, extracted)
    expect(result.mergedEquipment.emptyWeightKg).toBe('265')
    expect(result.mergedEquipment.tighteningMaxA).toBe('66')

    // Material das placas não foi duplicado
    const matFields = result.mergedEquipment.customFields?.filter(
      (c) => c.label.toLowerCase() === 'material das placas',
    )
    expect(matFields?.length).toBe(1)
    expect(matFields?.[0].value).toBe('AISI 304') // preservado o existente

    // Novo campo 'Área Térmica' foi inserido
    const areaField = result.mergedEquipment.customFields?.find((c) => c.label === 'Área Térmica')
    expect(areaField?.value).toBe('25 m²')
  })
})
