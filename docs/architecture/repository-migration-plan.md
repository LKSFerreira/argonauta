# Plano de migração da arquitetura do repositório

## Estado inicial auditado

- Branch inicial: `main`, sem alterações locais.
- Baseline: 77 testes aprovados — contratos 53, probe 11 e Native Messaging 13.
- Fixtures PING/PONG com hashes SHA-256 congelados.
- Native Messaging Host registrado em `HKCU` por caminho absoluto.
- Dependência frágil: contratos utilizavam o TypeScript instalado pelo probe.

## Arquitetura escolhida

```text
argonauta/
├── .github/workflows/
├── packages/protocol/
├── tools/compatibility-probe/
├── tools/native-messaging-smoke/
├── tests/integration/
├── docs/
│   ├── architecture/decisions/
│   ├── development/
│   ├── security/
│   └── validation/
└── scripts/
```

`apps/` e `packages/ipc` não serão materializados até possuírem implementação real aprovada.

## Mapa de migração

| Caminho anterior | Caminho novo | Justificativa |
|---|---|---|
| `experiments/poc-05b-contratos` | `packages/protocol` | Código reutilizável, independente de transporte e plataforma. |
| `experiments/antigravity-extension-probe` | `tools/compatibility-probe` | Ferramenta interna de diagnóstico. |
| `experiments/chrome-native-bridge` | `tools/native-messaging-smoke` | Teste de fumaça, não aplicação de produção. |
| Teste de compatibilidade dentro dos contratos | `tests/integration` | Cenário que atravessa protocolo e Native Messaging. |
| `docs/experiments` | `docs/validation` e `docs/architecture` | Separação entre evidências históricas e desenho vigente. |

## Etapas e verificações

1. Migrar o pacote de protocolo e preservar fixtures.
2. Migrar ferramentas e corrigir caminhos relativos.
3. Adotar npm workspaces e `tsconfig.base.json`.
4. Separar o teste entre componentes.
5. Atualizar documentação, scripts Windows e CI.
6. Executar typecheck, 77 testes, auditoria, verificação de fixtures, links e `git diff --check`.

## Rollback

Antes de qualquer commit, o rollback do repositório consiste em abandonar a branch de trabalho somente após confirmar que não existem alterações do mantenedor misturadas. Essa operação não é executada automaticamente.

Para o Windows, o rollback operacional consiste em remover manualmente a chave atual com `uninstall-host.ps1`, restaurar o checkout anterior e executar manualmente o instalador daquele checkout. Nenhum script de migração altera o Registro sem confirmação textual.

## Critérios de aceitação

- Contratos `1.0`, framing e comportamento PING/PONG inalterados.
- Hashes das fixtures idênticos.
- 77 testes aprovados sem exclusões.
- TypeScript estrito aprovado.
- Nenhuma dependência relativa atravessando projetos.
- Nenhuma permissão Chrome ampliada.
- CI reproduz as verificações não interativas em Windows.
- Validações no Antigravity e Chrome registradas como manuais.
