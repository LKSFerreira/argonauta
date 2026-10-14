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

Abra `tools/compatibility-probe/` no Antigravity IDE, execute `npm run compilar` pela raiz ou pelo workspace e inicie a configuração **Executar probe no Antigravity**. O roteiro detalhado está em [tools/compatibility-probe/README.md](../../tools/compatibility-probe/README.md).

## Chrome Native Messaging

O teste automatizado não altera o Registro. A instalação e desinstalação manuais estão descritas em [POC-05A.md](../validation/POC-05A.md).

Depois de mover o repositório, reinstale manualmente o host para atualizar o caminho absoluto. A validação no Chrome deve ser registrada como `pending_manual_validation` até a confirmação visual do PONG.
