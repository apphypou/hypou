# Diagnóstico de build

Builds móveis devem usar Node `>=22 <25`. Se o build ficar lento ou travar,
primeiro confirme o ambiente:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mobile:doctor
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build:mobile:trace
```

Não altere código de produto para compensar um ambiente local sujo. Reinstale
dependências com Node 22 e mantenha os builds fora de diretórios sincronizados
pelo iCloud.
