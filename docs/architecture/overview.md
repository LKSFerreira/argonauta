# Arquitetura do Argonauta

## Estado atual

O repositório separa código reutilizável de ferramentas de validação. As aplicações definitivas ainda não existem e não são simuladas por diretórios vazios.

```text
tests/integration
      │
      ├──────────────┐
      ▼              ▼
packages/protocol   tools/native-messaging-smoke
      ▲
      │ contratos futuros
      │
apps/* e packages/ipc  (ainda não implementados)
```

## Componentes

### `@argonauta/protocol`

Biblioteca TypeScript independente de Chrome, Windows, Antigravity e transporte. Define mensagens, validação, framing, limites e erros do protocolo `1.0`.

### `@argonauta/compatibility-probe`

Extensão de diagnóstico carregada manualmente no Antigravity IDE. Usa somente APIs públicas compatíveis com VS Code e não implementa transporte IPC.

### `@argonauta/native-messaging-smoke`

Ferramenta da POC-05A com extensão Chrome MV3 e host Node.js por stdio. Existe para preservar e repetir a evidência PING/PONG, não como host final.

### `@argonauta/integration-tests`

Valida a compatibilidade binária entre o pacote de protocolo e a implementação aprovada da POC-05A usando imports por pacote.

## Direção das dependências

- Ferramentas e aplicações podem depender de contratos compartilhados.
- `packages/protocol` não depende de ferramentas, aplicações ou plataforma.
- Testes de integração podem depender de múltiplos workspaces.
- Nenhum pacote central importa APIs do Antigravity IDE ou Chrome.

## Decisões

- [ADR-0001 — Arquitetura do monorepo TypeScript](decisions/0001-monorepo-architecture.md)
- [Plano de migração](repository-migration-plan.md)
- [Desenho da ponte futura](bridge-design.md)
