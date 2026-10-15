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

  it('mapeia códigos industriais (TAG, MOD, N° SÉRIE, ANO, PS, TS, Q, KW, A, V, FL, NEMA, DN, CL)', () => {
    const eq: EquipmentItem = {
      ...baseEquipment,
      model: '',
      manufacturingNumber: '',
      tag: '',
      flowRate: '',
      flowUnit: '',
    }

    const extracted: NameplateExtractedData = {
      tag: 'TC-101',
      model: 'BP 60 B',
      manufacturingNumber: '998.112',
      manufacturingYear: '2024',
      designPressureBar: '16,00', // PS
      designTempC: '180', // TS
      flowRate: '55,5', // Q
      flowUnit: 'm³/h',
      service: 'AQUECIMENTO DE VAPOR', // FL / SERVIÇO
      connectionSize: 'DN 80', // DN
      extraFields: [
        { label: 'Potência (kW)', value: '15 kW' }, // KW
        { label: 'Corrente (A)', value: '28 A' }, // A
        { label: 'Tensão (V)', value: '380 V' }, // V
        { label: 'Classificação NEMA / IP', value: 'NEMA 4X' }, // NEMA
        { label: 'Classe de Pressão (CL)', value: 'CL 150' }, // CL
      ],
    }

    const result = compareAndMergeNameplateData(eq, extracted)

    expect(result.mergedEquipment.tag).toBe('TC-101')
    expect(result.mergedEquipment.model).toBe('BP 60 B')
    expect(result.mergedEquipment.manufacturingNumber).toBe('998.112')
    expect(result.mergedEquipment.manufacturingYear).toBe('2024')
    expect(result.mergedEquipment.designPressureBar).toBe('16,00')
    expect(result.mergedEquipment.designTempC).toBe('180')
    expect(result.mergedEquipment.flowRate).toBe('55,5')
    expect(result.mergedEquipment.flowUnit).toBe('m³/h')
    expect(result.mergedEquipment.service).toBe('AQUECIMENTO DE VAPOR')

    // Custom fields criados para grandezas extras
    const customLabels = result.mergedEquipment.customFields?.map((c) => c.label)
    expect(customLabels).toContain('Potência (kW)')
    expect(customLabels).toContain('Corrente (A)')
    expect(customLabels).toContain('Tensão (V)')
    expect(customLabels).toContain('Classificação NEMA / IP')
    expect(customLabels).toContain('Classe de Pressão (CL)')
  })

  it('preenche campos da seção principal quando dados vêm apenas dentro de extraFields (labels pt-BR com unidades)', () => {
    const eq: EquipmentItem = {
      ...baseEquipment,
      manufacturer: '',
      model: '',
      manufacturingNumber: '',
      serialNumber: '',
      tag: '',
      service: '',
      manufacturingYear: '',
      designPressureBar: '',
      testPressureBar: '',
      designTempC: '',
      pmtaMpa: '',
      emptyWeightKg: '',
      tighteningMaxA: '',
      tighteningMinA: '',
      plateCount: '',
      fluid1: '',
      fluid2: '',
      flowRate: '',
      flowUnit: '',
    }

    // Payload onde as propriedades de primeiro nível estão vazias e todos os dados estão em extraFields
    const extractedOnlyInExtra: NameplateExtractedData = {
      extraFields: [
        { label: 'Fabricante', value: 'BERMO VÁLVULAS' },
        { label: 'MOD', value: 'BP 60 B' },
        { label: 'N° FAB', value: '639.065' },
        { label: 'TAG', value: 'TC-01' },
        { label: 'SERVIÇO', value: 'RESFRIAMENTO' },
        { label: 'ANO DE FABRICAÇÃO', value: '2025' },
        { label: 'Pressão de Projeto (bar)', value: '10,00 bar' },
        { label: 'Pressão de Teste (bar)', value: '13,00 bar' },
        { label: 'Temp. de Projeto (°C)', value: '165 °C' },
        { label: 'PMTA (MPa)', value: '1,13 MPa' },
        { label: 'Peso Vazio (kgf)', value: '265 kgf' },
        { label: 'Medida a máx (mm)', value: '66 mm' },
        { label: 'Medida a mín (mm)', value: '70 mm' },
        { label: 'Q (Vazão)', value: '45,5 m³/h' },
        { label: 'Placas', value: '64' },
        { label: 'Fluido 1', value: 'Salmoura' },
        { label: 'Fluido 2', value: 'Água industrial' },
        // Campos que NÃO pertencem à seção principal -> devem ir para customFields
        { label: 'Material das Placas', value: 'AISI 316L' },
        { label: 'Potência (kW)', value: '22 kW' },
        { label: 'Norma de Fabricação', value: 'ASME VIII' },
      ],
    }

    const result = compareAndMergeNameplateData(eq, extractedOnlyInExtra)

    // Todos os campos da seção principal foram devidamente preenchidos
    expect(result.mergedEquipment.manufacturer).toBe('BERMO VÁLVULAS')
    expect(result.mergedEquipment.model).toBe('BP 60 B')
    expect(result.mergedEquipment.manufacturingNumber).toBe('639.065')
    // Espelhado automaticamente em serialNumber
    expect(result.mergedEquipment.serialNumber).toBe('639.065')
    expect(result.mergedEquipment.tag).toBe('TC-01')
    expect(result.mergedEquipment.service).toBe('RESFRIAMENTO')
    expect(result.mergedEquipment.manufacturingYear).toBe('2025')
    expect(result.mergedEquipment.designPressureBar).toBe('10,00')
    expect(result.mergedEquipment.testPressureBar).toBe('13,00')
    expect(result.mergedEquipment.designTempC).toBe('165')
    expect(result.mergedEquipment.pmtaMpa).toBe('1,13')
    expect(result.mergedEquipment.emptyWeightKg).toBe('265')
    expect(result.mergedEquipment.tighteningMaxA).toBe('66')
    expect(result.mergedEquipment.tighteningMinA).toBe('70')
    expect(result.mergedEquipment.flowRate).toBe('45,5')
    expect(result.mergedEquipment.flowUnit).toBe('m³/h')
    expect(result.mergedEquipment.plateCount).toBe('64')
    expect(result.mergedEquipment.fluid1).toBe('Salmoura')
    expect(result.mergedEquipment.fluid2).toBe('Água industrial')

    // Apenas os campos industriais sem correspondente na seção principal viraram customFields
    const customLabels = result.mergedEquipment.customFields?.map((c) => c.label)
    expect(customLabels).toContain('Material das Placas')
    expect(customLabels).toContain('Potência (kW)')
    expect(customLabels).toContain('Norma de Fabricação')
    // Nenhum dos campos principais deve estar em customFields
    expect(customLabels).not.toContain('Pressão de Projeto (bar)')
    expect(customLabels).not.toContain('PMTA (MPa)')
    expect(customLabels).not.toContain('Medida a máx (mm)')
    expect(customLabels).not.toContain('N° FAB')
  })

  it('espelha mutuamente manufacturingNumber e serialNumber quando apenas um deles é extraído', () => {
    // Caso 1: Apenas serialNumber é extraído
    const extractedSerialOnly: NameplateExtractedData = {
      serialNumber: 'ABC-7788',
    }
    const res1 = compareAndMergeNameplateData(baseEquipment, extractedSerialOnly)
    expect(res1.mergedEquipment.serialNumber).toBe('ABC-7788')
    expect(res1.mergedEquipment.manufacturingNumber).toBe('ABC-7788')

    // Caso 2: Apenas manufacturingNumber é extraído
    const extractedManufOnly: NameplateExtractedData = {
      manufacturingNumber: 'MN-9922',
    }
    const res2 = compareAndMergeNameplateData(baseEquipment, extractedManufOnly)
    expect(res2.mergedEquipment.manufacturingNumber).toBe('MN-9922')
    expect(res2.mergedEquipment.serialNumber).toBe('MN-9922')

    // Caso 3: Via extraFields com "N° SÉRIE"
    const extractedExtraSerial: NameplateExtractedData = {
      extraFields: [{ label: 'N° SÉRIE', value: 'SER-4411' }],
    }
    const res3 = compareAndMergeNameplateData(baseEquipment, extractedExtraSerial)
    expect(res3.mergedEquipment.serialNumber).toBe('SER-4411')
    expect(res3.mergedEquipment.manufacturingNumber).toBe('SER-4411')
  })

  it('extrai vazão e unidade de vazão quando informados com siglas e unidades diversas', () => {
    const extractedFlow: NameplateExtractedData = {
      extraFields: [{ label: 'VAZÃO (m³/h)', value: '120,5 m³/h' }],
    }
    const res = compareAndMergeNameplateData(baseEquipment, extractedFlow)
    expect(res.mergedEquipment.flowRate).toBe('120,5')
    expect(res.mergedEquipment.flowUnit).toBe('m³/h')
  })

  it('normaliza o mapa de confiança garantindo tipos válidos e preserva no nameplateOcrData', () => {
    const extractedWithConf: NameplateExtractedData = {
      model: 'BP 60 B',
      confidence: {
        model: 'high',
        serialNumber: 'medium',
        designPressureBar: 0.95,
        tag: 'clara',
        pmtaMpa: 'parcial',
      },
    }
    const res = compareAndMergeNameplateData(baseEquipment, extractedWithConf)
    expect(res.mergedEquipment.nameplateOcrData?.confidence).toBeDefined()
    expect(res.mergedEquipment.nameplateOcrData?.confidence?.model).toBe('high')
    expect(res.mergedEquipment.nameplateOcrData?.confidence?.serialNumber).toBe('medium')
    expect(res.mergedEquipment.nameplateOcrData?.confidence?.designPressureBar).toBe(0.95)
    expect(res.mergedEquipment.nameplateOcrData?.confidence?.tag).toBe('high')
    expect(res.mergedEquipment.nameplateOcrData?.confidence?.pmtaMpa).toBe('medium')
  })

  it('mantém em customFields dados elétricos, de tubulação e normas sem regredir a seção complementar', () => {
    const extractedExtras: NameplateExtractedData = {
      extraFields: [
        { label: 'KW', value: '30 kW' },
        { label: 'Corrente (A)', value: '45 A' },
        { label: 'Tensão (V)', value: '440 V' },
        { label: 'DN', value: 'DN 100' },
        { label: 'Classe de Pressão (CL)', value: 'CL 300' },
        { label: 'NEMA', value: 'NEMA 4' },
        { label: 'Norma Técnica', value: 'NR-13' },
        { label: 'Material do Chassi', value: 'Aço Carbono' },
      ],
    }
    const res = compareAndMergeNameplateData(baseEquipment, extractedExtras)
    const customLabels = res.mergedEquipment.customFields?.map((c) => c.label)
    expect(customLabels).toContain('KW')
    expect(customLabels).toContain('Corrente (A)')
    expect(customLabels).toContain('Tensão (V)')
    expect(customLabels).toContain('DN')
    expect(customLabels).toContain('Classe de Pressão (CL)')
    expect(customLabels).toContain('NEMA')
    expect(customLabels).toContain('Norma Técnica')
    expect(customLabels).toContain('Material do Chassi')
  })
})
