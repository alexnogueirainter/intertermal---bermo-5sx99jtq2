/**
 * Hook: Transcrição de áudio via IA (Whisper / OpenAI compatible gateway)
 * Route: POST /backend/v1/audio/transcribe
 *
 * Recebe o arquivo de áudio gravado no dispositivo (mp4, m4a, webm, wav, aac)
 * via multipart form-data ("file") ou JSON { audioBase64, mimeType }
 * e envia ao gateway de áudio / Whisper da plataforma Skip Cloud.
 *
 * Utilizado como fallback universal confiável no iOS Safari e navegadores onde
 * a Web Speech API nativa falha ou não transcreve.
 */
routerAdd('POST', '/backend/v1/audio/transcribe', (e) => {
  // Config do gateway: segredos do projeto ($secrets.get) com fallback para env.
  // $os.getenv NÃO enxerga segredos do Skip Cloud — sem isso a rota responde
  // service_unavailable mesmo com o gateway configurado.
  let gatewayUrl = ''
  let gatewayKey = ''
  try {
    gatewayUrl = $secrets.get('SKIP_AI_GATEWAY_URL') || ''
  } catch (_) {
    gatewayUrl = ''
  }
  try {
    gatewayKey = $secrets.get('SKIP_AI_GATEWAY_API_KEY') || ''
  } catch (_) {
    gatewayKey = ''
  }
  if (!gatewayUrl) gatewayUrl = $os.getenv('SKIP_AI_GATEWAY_URL') || ''
  if (!gatewayKey) gatewayKey = $os.getenv('SKIP_AI_GATEWAY_API_KEY') || ''
  console.log(
    '[audio_transcribe] gateway configurado: ' +
      (gatewayUrl ? 'sim' : 'NAO') +
      ' | key: ' +
      (gatewayKey ? 'sim' : 'NAO'),
  )

  // 1. Tenta obter arquivo multipart "file" ou "audio".
  // Body JSON (fallback base64) NÃO pode quebrar a rota no findUploadedFiles.
  let uploadedFiles = []
  try {
    uploadedFiles = e.findUploadedFiles('file') || e.findUploadedFiles('audio') || []
  } catch (_) {
    uploadedFiles = []
  }

  if (uploadedFiles && uploadedFiles.length > 0) {
    const file = uploadedFiles[0]
    // Se o gateway OpenAI Whisper estiver configurado
    if (gatewayUrl && gatewayKey) {
      try {
        let endpoint = gatewayUrl.replace(/\/+$/, '')
        if (!endpoint.endsWith('/audio/transcriptions')) {
          endpoint = endpoint + '/audio/transcriptions'
        }

        // Encaminha para o endpoint de transcrição
        const res = $http.send({
          url: endpoint,
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + gatewayKey,
          },
          // PocketBase $http suporta envio de multipart
          body: {
            file: file,
            model: 'whisper-1',
            language: 'pt',
          },
          timeout: 45,
        })

        if (res.statusCode === 200 && res.json && res.json.text) {
          return e.json(200, {
            ok: true,
            text: res.json.text.trim(),
            source: 'whisper_gateway',
          })
        }
        console.log(
          '[audio_transcribe] gateway status inesperado: ' +
            res.statusCode +
            ' | body: ' +
            JSON.stringify(res.json || {}).slice(0, 300),
        )
      } catch (err) {
        console.log('[audio_transcribe] gateway upload error: ' + err)
      }
    }
  }

  // 2. Se não conseguiu via gateway de áudio direto, verifica se recebemos base64 ou fallback
  const body = e.requestInfo().body || {}
  const audioBase64 = body.audioBase64 || ''
  const mimeType = body.mimeType || 'audio/mp4'

  if (gatewayUrl && gatewayKey && audioBase64) {
    try {
      let endpoint = gatewayUrl.replace(/\/+$/, '')
      if (!endpoint.endsWith('/audio/transcriptions')) {
        endpoint = endpoint + '/audio/transcriptions'
      }

      // Converte base64 para multipart payload ou chamada direta se compatível
      const res = $http.send({
        url: endpoint,
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + gatewayKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'whisper-1',
          file: audioBase64,
          language: 'pt',
        }),
        timeout: 45,
      })

      if (res.statusCode === 200 && res.json && res.json.text) {
        return e.json(200, {
          ok: true,
          text: res.json.text.trim(),
          source: 'whisper_gateway_base64',
        })
      }
    } catch (err) {
      console.log('[audio_transcribe] base64 gateway error: ' + err)
    }
  }

  return e.json(200, {
    ok: false,
    reason: 'service_unavailable',
    message: 'Serviço de transcrição em nuvem indisponível.',
  })
})
