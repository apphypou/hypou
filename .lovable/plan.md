## O que encontrei

O problema mais provável está em três pontos do fluxo atual:

1. O `MediaRecorder` pode parar antes de emitir o último `dataavailable`, principalmente em mobile/Safari/Chrome mobile. Hoje o código monta o Blob direto no `onstop`, então às vezes ele fica com `audioChunksRef` vazio e mostra “Áudio vazio”.
2. A detecção de silêncio via `AnalyserNode` usa um limiar muito baixo/instável e pode dar falso negativo dependendo do microfone, volume, Bluetooth ou permissões do navegador.
3. O player tenta corrigir duração WebM com seek extremo, mas se o metadata não carregar ou a URL/codec vier ruim, ele fica em `--:--` e o play pode não tocar nada sem mostrar erro claro.

## Plano de correção

1. **Tornar a gravação resiliente**
   - Criar um controle de sessão de gravação com ID único para evitar eventos atrasados de gravações antigas.
   - No `stopRecording`, chamar `recorder.requestData()` antes de `recorder.stop()` quando possível.
   - Aguardar o ciclo correto de `dataavailable` antes de montar o Blob.
   - Não zerar refs cedo demais enquanto o `onstop` ainda precisa delas.

2. **Remover falso “áudio vazio”**
   - Trocar a validação agressiva de silêncio por validação objetiva: duração mínima + tamanho real do Blob.
   - Manter bloqueio apenas para Blob realmente vazio ou gravação extremamente curta.
   - Se houver Blob válido, enviar mesmo que o detector de som não tenha marcado fala.

3. **Melhorar compatibilidade de formato**
   - Escolher MIME type com fallback mais seguro por navegador.
   - Preservar `recorder.mimeType` real no arquivo enviado.
   - Evitar extensão incompatível com o tipo final.

4. **Corrigir player que fica `--:--` / não toca**
   - Adicionar handlers de `canplay`, `loadedmetadata`, `durationchange` e `error`.
   - Se não conseguir duração, ainda permitir tocar e mostrar `0:00`/tempo atual em vez de travar.
   - Resetar corretamente estado ao trocar o `src`.

5. **Adicionar logs temporários seguros de diagnóstico**
   - Registrar no console: MIME escolhido, chunks recebidos, tamanho final, duração estimada, erro de play/load.
   - Assim, se ainda falhar no seu aparelho, a próxima mensagem já traz o motivo exato nos logs.

6. **Atualizar `documentacao.md`**
   - Documentar o novo fluxo de gravação resiliente, porque altera arquitetura do áudio no chat.