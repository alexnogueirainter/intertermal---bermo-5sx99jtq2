import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Layers,
  Flame,
  Disc,
  CircleDot,
  Cpu,
  Wrench,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  FileText,
  Building2,
  Plus,
  Info,
  Shield,
  Zap,
} from 'lucide-react'
import {
  BERMO_CATALOG,
  BERMO_CATEGORIES,
  BermoProductItem,
  BermoCategoryKey,
} from '@/data/bermo-catalog'

interface BermoCatalogViewerProps {
  onSelectProductForQuote?: (product: BermoProductItem) => void
}

const CATEGORY_ICON_MAP: Record<BermoCategoryKey, any> = {
  heat_exchanger_gasketed: Layers,
  heat_exchanger_brazed: Flame,
  butterfly_valves: Disc,
  ball_valves: CircleDot,
  automation: Cpu,
  industrial_accessories: Wrench,
}

export const BermoCatalogViewer: React.FC<BermoCatalogViewerProps> = ({
  onSelectProductForQuote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<BermoProductItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const filteredProducts = BERMO_CATALOG.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.specs.materials && p.specs.materials.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const openProductDetails = (product: BermoProductItem) => {
    setSelectedProduct(product)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header com Branding BERMO & Intertermal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-teal-800/40">
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md border border-teal-400/30">
            <Shield className="h-3.5 w-3.5 text-teal-400" />
            Catálogo Oficial BERMO (Válvulas & Trocadores)
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Equipamentos & Engenharia Térmica BERMO
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Consulte a linha completa de{' '}
            <strong>Trocadores de Calor a Placas (Gaxetados e Brasados)</strong>,{' '}
            <strong>Válvulas Borboleta ARI Armaturen</strong>, <strong>Válvulas de Esfera</strong>,{' '}
            <strong>Automação e Acessórios Industriais</strong> com especificações técnicas oficiais
            para prestação de serviços.
          </p>
        </div>
      </div>

      {/* Navegação por Categorias BERMO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === 'all'
              ? 'bg-teal-700 text-white border-teal-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-500'
          }`}
        >
          <div className="text-xs font-bold">Todos os Produtos</div>
          <div className="text-[10px] opacity-80 mt-0.5">{BERMO_CATALOG.length} modelos</div>
        </button>

        {BERMO_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICON_MAP[cat.key]
          const isSelected = selectedCategory === cat.key
          const count = BERMO_CATALOG.filter((p) => p.category === cat.key).length

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-500'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon
                  className={`h-3.5 w-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'}`}
                />
                <span className="text-[11px] font-bold leading-tight line-clamp-1">
                  {cat.label.split(' ')[0]}
                </span>
              </div>
              <div className="text-[10px] opacity-80">{count} modelos</div>
            </button>
          )
        })}
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto BERMO (ex: BP6, BL14, ARI-ZESA, Trunnion, SUV, Gaxetas, AISI 316L)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg h-9"
        />
      </div>

      {/* Grid de Cards de Produtos BERMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const Icon = CATEGORY_ICON_MAP[p.category] || Wrench

          return (
            <Card
              key={p.id}
              className="border-slate-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-600 hover:shadow-md transition-all flex flex-col justify-between bg-white dark:bg-slate-900 group"
            >
              <CardHeader className="pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-900">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 font-mono">
                        {p.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {p.name}
                      </h3>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-semibold ${
                      p.brand === 'ARI Armaturen'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300'
                        : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200'
                    }`}
                  >
                    {p.brand}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                  {p.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Destaques Técnicos Rápidos */}
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  {p.specs.connection && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conexão:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {p.specs.connection}
                      </span>
                    </div>
                  )}
                  {p.specs.maxPressure && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pressão Máx:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.specs.maxPressure}
                      </span>
                    </div>
                  )}
                  {p.specs.maxTemperature && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temp Máx:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.specs.maxTemperature}
                      </span>
                    </div>
                  )}
                  {p.specs.materials && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materiais:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {p.specs.materials}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Ref. Base</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {p.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProductDetails(p)}
                      className="text-[11px] h-7 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Ficha Técnica
                    </Button>

                    {onSelectProductForQuote && (
                      <Button
                        size="sm"
                        onClick={() => onSelectProductForQuote(p)}
                        className="text-[11px] h-7 px-2.5 bg-teal-700 hover:bg-teal-600 text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Orçar Serviço
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal Detalhado com Especificações Técnicas Completas */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono text-[10px]">
                    {selectedProduct.code}
                  </Badge>
                  <span className="text-xs font-bold text-slate-500">
                    Marca: {selectedProduct.brand}
                  </span>
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedProduct.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedProduct.categoryLabel}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Especificações Técnicas de Engenharia
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedProduct.specs.dimensions && (
                      <div className="p-2.5 flex justify-between bg-white dark:bg-slate-950">
                        <span className="text-muted-foreground font-medium">
                          Dimensões Físicas:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.dimensions}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.connection && (
                      <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-muted-foreground font-medium">
                          Conexão Hidráulica/Vapor:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.connection}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.maxTemperature && (
                      <div className="p-2.5 flex justify-between bg-white dark:bg-slate-950">
                        <span className="text-muted-foreground font-medium">
                          Temperatura de Operação:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.maxTemperature}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.maxPressure && (
                      <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-muted-foreground font-medium">
                          Pressão Máxima de Projeto/Teste:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.maxPressure}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.maxFlowRate && (
                      <div className="p-2.5 flex justify-between bg-white dark:bg-slate-950">
                        <span className="text-muted-foreground font-medium">
                          Vazão Volumétrica / Carga:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.maxFlowRate}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.heatExchangeArea && (
                      <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-muted-foreground font-medium">
                          Área de Troca Térmica:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.heatExchangeArea}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.materials && (
                      <div className="p-2.5 flex justify-between bg-white dark:bg-slate-950">
                        <span className="text-muted-foreground font-medium">
                          Materiais Construtivos:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.materials}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.gaskets && (
                      <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-muted-foreground font-medium">
                          Sedes / Vedação / Gaxetas:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.gaskets}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.typeOrFeatures && (
                      <div className="p-2.5 flex justify-between bg-white dark:bg-slate-950">
                        <span className="text-muted-foreground font-medium">
                          Construção & Recursos:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.specs.typeOrFeatures}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specs.applications && (
                      <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-muted-foreground font-medium">
                          Aplicações Recomendadas:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-right max-w-[320px]">
                          {selectedProduct.specs.applications}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
                {onSelectProductForQuote && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onSelectProductForQuote(selectedProduct)
                      setIsDetailModalOpen(false)
                    }}
                    className="bg-teal-700 hover:bg-teal-600 text-white text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Gerar Orçamento de Serviço
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
