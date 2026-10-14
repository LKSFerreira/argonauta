# Arquitetura do Argonauta

## Estado atual

O repositório separa código reutilizável de ferramentas de validação e aplicações em `apps/`. O foco de aplicação ativa é a extensão real em `apps/ide-extension/` (painel na Activity Bar, núcleo de agente e pacote `.vsix`), enquanto pontes IPC permanecem como trilhas condicionais.

```text
tests/integration
      │
      ├──────────────┐
      ▼              ▼
packages/protocol   tools/native-messaging-smoke
      ▲
      │ consome contratos
      │
apps/ide-extension  (em implementação; pacote .vsix e núcleo de agente)
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
- [ADR-0003 — Helper Win32 para o gate de segurança do Named Pipe](decisions/0003-win32-named-pipe-security-probe.md)
- [Plano de migração](repository-migration-plan.md)
- [Desenho da ponte futura](bridge-design.md)

## Gate atual do transporte IPC

O transporte básico por Windows Named Pipe foi comprovado com `node:net`, mas a DACL efetiva permaneceu legível por `Everyone` e `Anonymous`, e uma conexão pelo namespace `\\localhost\pipe` foi aceita. A API pública avaliada não expõe a criação com descritor de segurança explícito nem `PIPE_REJECT_REMOTE_CLIENTS`.

Por isso, `packages/ipc`, o harness e o comando da IDE não foram implementados. A investigação do helper Win32 também permanece bloqueada porque o ambiente autorizado não contém toolchain C/C++ nem Windows SDK. Consulte o [relatório do gate `node:net`](../validation/ipc-transport.md) e a [investigação Win32](../validation/ipc-win32-feasibility.md).
