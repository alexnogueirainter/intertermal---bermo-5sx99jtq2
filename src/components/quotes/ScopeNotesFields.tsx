import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface ScopeNotesFieldsProps {
  scopeOfWork: string
  setScopeOfWork: Dispatch<SetStateAction<string>>
  technicalNotes: string
  setTechnicalNotes: Dispatch<SetStateAction<string>>
  commercialNotes: string
  setCommercialNotes: Dispatch<SetStateAction<string>>
  handleInsertStandardScope: () => any
}

export function ScopeNotesFields(props: ScopeNotesFieldsProps) {
  const {
    scopeOfWork,
    setScopeOfWork,
    technicalNotes,
    setTechnicalNotes,
    commercialNotes,
    setCommercialNotes,
    handleInsertStandardScope,
  } = props

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Escopo Detalhado do Fornecimento</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleInsertStandardScope}
            className="h-6 px-2 text-[11px] text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
          >
            <Sparkles className="h-3 w-3 mr-1 text-teal-600" />
            Inserir descrição padrão
          </Button>
        </div>
        <Textarea
          rows={4}
          value={scopeOfWork}
          onChange={(e) => setScopeOfWork(e.target.value)}
          placeholder="Descreva detalhadamente a metodologia técnica e escopo do serviço..."
          className="text-xs leading-relaxed"
        />
      </div>

      {/* Mensagem ao Cliente e Observações Técnicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Mensagem ao Cliente (Aparece na Proposta / PDF)
          </Label>
          <Textarea
            rows={2}
            value={commercialNotes}
            onChange={(e) => setCommercialNotes(e.target.value)}
            placeholder="Ex: Prezado cliente, apresentamos nossa proposta técnica e comercial..."
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Observações Técnicas / Restrições de Campo
          </Label>
          <Textarea
            rows={2}
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Ex: Ponto de água e energia 220V fornecidos pelo contratante..."
            className="text-xs"
          />
        </div>
      </div>
    </>
  )
}
