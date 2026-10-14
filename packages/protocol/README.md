# `@argonauta/protocol`

Biblioteca TypeScript independente de transporte para os contratos versionados do Argonauta.

## Responsabilidades

- tipos e mensagens do protocolo `1.0`;
- validação estrita em fronteiras de confiança;
- framing `[uint32][JSON UTF-8]`;
- serialização estruturalmente segura;
- decodificação incremental com limites explícitos;
- erros determinísticos sem incluir conteúdo sensível.

O pacote não depende de Chrome, Windows, Antigravity IDE, VS Code, Named Pipes ou rede.

## Uso no monorepo

```typescript
import {
  DecodificadorEnquadramento,
  serializarEnquadramento,
  validarMensagem
} from '@argonauta/protocol';
```

Os identificadores públicos permanecem em pt-BR porque já compõem o contrato interno aprovado. Renomeá-los exigiria uma decisão de versionamento própria.

## Validação

```powershell
npm --workspace @argonauta/protocol run typecheck
npm --workspace @argonauta/protocol test
npm run verificar:fixtures
```

As fixtures PING/PONG são congeladas e verificadas por SHA-256.
