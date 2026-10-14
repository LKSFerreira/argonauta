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
apps/* e packages/ipc  (ainda não implementados; IPC bloqueado pelo gate de segurança)
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
- [ADR-0002 — Gate de segurança do Windows Named Pipe com `node:net`](decisions/0002-node-net-security-gate.md)
- [Plano de migração](repository-migration-plan.md)
- [Desenho da ponte futura](bridge-design.md)

## Gate atual do transporte IPC

O transporte básico por Windows Named Pipe foi comprovado com `node:net`, mas a DACL efetiva permaneceu legível por `Everyone` e `Anonymous`, e uma conexão pelo namespace `\\localhost\pipe` foi aceita. A API pública avaliada não expõe a criação com descritor de segurança explícito nem `PIPE_REJECT_REMOTE_CLIENTS`.

Por isso, `packages/ipc`, o harness e o comando da IDE não foram implementados. Consulte o [relatório do gate](../validation/ipc-transport.md).
