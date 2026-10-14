# Guia de desenvolvimento

## Pré-requisitos

- Windows.
- Node.js 20 ou superior disponível no `PATH`.
- npm incluído na instalação do Node.js.
- Antigravity IDE.
- Google Chrome para a validação manual da POC-05A.

O projeto não exige VS Code nem dependências globais.

## Instalação reproduzível

Na raiz do repositório:

```powershell
npm ci
```

## Verificações globais

```powershell
npm run typecheck
npm test
npm run verificar:fixtures
npm audit --audit-level=high
git diff --check
```

`npm run verificar` reúne typecheck, testes e verificação das fixtures.

## Desenvolvimento por workspace

```powershell
npm --workspace @argonauta/protocol test
npm --workspace @argonauta/compatibility-probe test
npm --workspace @argonauta/native-messaging-smoke test
npm --workspace @argonauta/integration-tests test
```

## Antigravity IDE

Abra `tools/compatibility-probe/` no Antigravity IDE, execute `npm run compilar` pela raiz ou pelo workspace e inicie a configuração **Executar probe no Antigravity**. Consulte o [roteiro de teste manual no Antigravity](../validation/manual-tests/02_antigravity-compatibility.md) e os [detalhes técnicos do probe](../../tools/compatibility-probe/README.md).

## Chrome Native Messaging

O teste automatizado não altera o Registro. A instalação, a validação e a desinstalação estão descritas no [roteiro de teste manual do Chrome](../validation/manual-tests/01_chrome-native-messaging.md). O histórico completo da POC permanece em [POC-05A.md](../validation/POC-05A.md).

Depois de mover o repositório, reinstale manualmente o host para atualizar o caminho absoluto. A repetição após a migração foi aprovada em 14/10/2026 com PONG no protocolo `1.0`; novas mudanças de caminho exigem uma nova validação manual.
