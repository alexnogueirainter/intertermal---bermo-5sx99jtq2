import { useState, useEffect } from 'react'
import {
  Paperclip,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  ExternalLink,
  UploadCloud,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InboundQuoteAttachmentRecord, InboundQuoteEmailRecord } from '@/types/crm'
import { inboundQuoteEmailsService, getInboundAttachmentUrl } from '@/services/inbound-quote-emails'
import { useToast } from '@/hooks/use-toast'

export interface QuoteAttachmentsPanelProps {
  quoteId?: string | null
  inboundEmail?: InboundQuoteEmailRecord | null
  className?: string
  readOnly?: boolean
}

export function QuoteAttachmentsPanel({
  quoteId,
  inboundEmail,
  className = '',
  readOnly = false,
}: QuoteAttachmentsPanelProps) {
  const { toast } = useToast()
  const [attachments, setAttachments] = useState<InboundQuoteAttachmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Carregar anexos vinculados à quote ou ao inboundEmail
  const loadAttachments = async () => {
    if (!quoteId && !inboundEmail?.id) {
      setAttachments([])
      return
    }

    setIsLoading(true)
    try {
      let list: InboundQuoteAttachmentRecord[] = []
      if (quoteId) {
        list = await inboundQuoteEmailsService.getAttachmentsByQuoteId(quoteId)
      }
      if (list.length === 0 && inboundEmail?.id) {
        list = await inboundQuoteEmailsService.getAttachmentsByEmailId(inboundEmail.id)
      }
      setAttachments(list)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [quoteId, inboundEmail?.id])

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const renderFileIcon = (fileName?: string, fileType?: string) => {
    const name = (fileName || '').toLowerCase()
    const type = (fileType || '').toLowerCase()
    if (type.includes('image') || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) {
      return <FileImage className="h-4 w-4 text-purple-500 shrink-0" />
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="h-4 w-4 text-rose-500 shrink-0" />
    }
    if (type.includes('sheet') || type.includes('excel') || name.match(/\.(xlsx?|csv)$/)) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
    }
    return <File className="h-4 w-4 text-teal-600 shrink-0" />
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const emailId = inboundEmail?.id || (attachments[0]?.inbound_email_id ?? '')
    if (!emailId) {
      toast({
        title: 'Vínculo de e-mail não encontrado',
        description:
          'Para anexar novos arquivos diretamente aqui, a proposta deve ter sido originada de uma cotação por e-mail.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    let successCount = 0
    try {
      for (const file of Array.from(files)) {
        const saved = await inboundQuoteEmailsService.uploadAttachment(
          emailId,
          file,
          quoteId || null,
        )
        if (saved) successCount++
      }

      if (successCount > 0) {
        toast({
          title: 'Anexo(s) salvo(s)',
          description: `${successCount} arquivo(s) adicionado(s) com sucesso à cotação.`,
        })
        await loadAttachments()
      }
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  if (!quoteId && !inboundEmail) {
    return null
  }

  return (
    <div
      className={`p-3.5 rounded-xl border border-teal-200/80 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-2xs">
            <Paperclip className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Anexos do Pedido de Cotação Original
              </span>
              <Badge
                variant="outline"
                className="bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800 text-[10px] px-1.5 py-0 font-mono font-semibold"
              >
                {attachments.length} anexo{attachments.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Arquivos enviados pelo cliente na solicitação (croquis, plaquetas, laudos ou editais)
            </p>
          </div>
        </div>

        {!readOnly && (inboundEmail?.id || attachments[0]?.inbound_email_id) && (
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs self-start sm:self-auto">
            <input
              type="file"
              multiple
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5 text-teal-600" />
                <span>Adicionar Arquivo</span>
              </>
            )}
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
          <span>Carregando anexos da cotação...</span>
        </div>
      ) : attachments.length === 0 ? (
        <div className="p-3 text-center rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs text-muted-foreground">
          Nenhum anexo associado a este pedido de cotação.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {attachments.map((att) => {
            const url = getInboundAttachmentUrl(att)
            return (
              <div
                key={att.id}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-300 transition-colors flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {renderFileIcon(att.file_name, att.file_type)}
                  <div className="min-w-0">
                    <p
                      className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate max-w-[150px]"
                      title={att.file_name}
                    >
                      {att.file_name || 'anexo'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatFileSize(att.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                    title="Visualizar em nova aba"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={url}
                    download={att.file_name || 'anexo'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-semibold shadow-2xs"
                    title={`Baixar ${att.file_name || 'anexo'}`}
                  >
                    <Download className="h-3 w-3" />
                    <span>Baixar</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
