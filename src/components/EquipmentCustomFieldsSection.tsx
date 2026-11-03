import React, { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { generateId } from '@/types/field-visit'
import { REVIEW_INPUT_YELLOW } from '@/components/field-visit/fieldVisitConfidence'

export interface CustomFieldItem {
  id: string
  label: string
  value: string
}

interface EquipmentCustomFieldsSectionProps {
  customFields?: CustomFieldItem[]
  onChange: (fields: CustomFieldItem[]) => void
  confidenceMap?: Record<string, number | 'high' | 'medium' | 'low'>
}

export function EquipmentCustomFieldsSection({
  customFields = [],
  onChange,
  confidenceMap,
}: EquipmentCustomFieldsSectionProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [manuallyEditedIds, setManuallyEditedIds] = useState<Record<string, boolean>>({})

  const handleAddField = () => {
    const trimmedLabel = newLabel.trim()
    const trimmedVal = newValue.trim()
    if (!trimmedLabel) return

    const updated = [
      ...customFields,
      {
        id: generateId(),
        label: trimmedLabel,
        value: trimmedVal,
      },
    ]
    onChange(updated)
    setNewLabel('')
    setNewValue('')
    setIsAdding(false)
  }

  const handleUpdateField = (id: string, patch: Partial<CustomFieldItem>) => {
    setManuallyEditedIds((prev) => ({ ...prev, [id]: true }))
    const updated = customFields.map((f) => (f.id === id ? { ...f, ...patch } : f))
    onChange(updated)
  }

  const getCustomFieldConfidence = (label: string): 'high' | 'medium' | 'low' | null => {
    if (!confidenceMap) return null
    const clean = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    for (const [k, v] of Object.entries(confidenceMap)) {
      const cleanKey = k
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
      if (cleanKey === clean || cleanKey.includes(clean) || clean.includes(cleanKey)) {
        if (v === 'high') return 'high'
        if (v === 'medium') return 'medium'
        if (v === 'low') return 'low'
        if (typeof v === 'number') {
          if (v >= 0.8) return 'high'
          if (v >= 0.5) return 'medium'
          return 'low'
        }
      }
    }
    return null
  }

  const handleRemoveField = (id: string) => {
    const updated = customFields.filter((f) => f.id !== id)
    onChange(updated)
  }

  return (
    <div className="rounded-xl border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/20 dark:bg-teal-950/10 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Campos Complementares da Plaqueta / Equipamento
          </span>
          {customFields.length > 0 && (
            <span className="text-[10px] font-semibold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 px-1.5 py-0.2 rounded">
              {customFields.length}
            </span>
          )}
        </div>
        {!isAdding && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-[11px] text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar campo
          </Button>
        )}
      </div>

      {/* Lista de campos existentes */}
      {customFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {customFields.map((field) => (
            <div
              key={field.id}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                    placeholder="Nome do campo"
                    className="w-full text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                  />
                  {(() => {
                    if (manuallyEditedIds[field.id]) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          editado
                        </span>
                      )
                    }
                    const conf = getCustomFieldConfidence(field.label)
                    if (conf === 'high') {
                      return (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0"
                          title="Lido com clareza da placa (alta confiança)"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Placa
                        </span>
                      )
                    }
                    if (conf === 'medium') {
                      return (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 px-1.5 py-0.5 rounded shrink-0"
                          title="Leitura parcial da placa (revisar)"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          Parcial
                        </span>
                      )
                    }
                    if (conf === 'low') {
                      return (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-yellow-900 bg-yellow-200 dark:bg-yellow-800/70 dark:text-yellow-100 px-1.5 py-0.5 rounded shrink-0 ring-1 ring-yellow-400"
                          title="Leitura com baixa confiança — conferir na foto da placa"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                          Conferir
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
                <Input
                  value={field.value}
                  onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                  placeholder="Valor"
                  className={`h-8 text-xs bg-slate-50/70 dark:bg-slate-950 ${conf === 'low' ? REVIEW_INPUT_YELLOW : ''}`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveField(field.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Remover campo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para novo campo */}
      {isAdding && (
        <div className="p-2.5 rounded-lg border border-dashed border-teal-300 dark:border-teal-700 bg-white/70 dark:bg-slate-900/70 space-y-2 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Nome do campo (ex.: Classe de Pressão, Fluido da Placa, Norma ASME)
              </label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex.: Classe de Pressão"
                className="h-8 text-xs bg-white dark:bg-slate-950"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Valor
              </label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ex.: PN 16 / ASME VIII"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewLabel('')
                setNewValue('')
              }}
              className="h-7 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddField}
              disabled={!newLabel.trim()}
              className="h-7 text-xs bg-teal-700 hover:bg-teal-600 text-white font-semibold"
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {customFields.length === 0 && !isAdding && (
        <p className="text-[10.5px] text-muted-foreground italic">
          Nenhum campo complementar adicionado ainda. Se a leitura da foto trouxer dados extras
          (ex.: classe de pressão, fluido da placa, norma), eles aparecerão aqui automaticamente.
        </p>
      )}
    </div>
  )
}
