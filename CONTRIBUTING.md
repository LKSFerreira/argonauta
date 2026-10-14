# Contribuindo com o Argonauta

Obrigado por considerar uma contribuição. O Argonauta está em discovery e aceita somente capacidades que possam ser demonstradas de forma segura, reproduzível e permitida.

## Ambiente

- Windows.
- Node.js 20 ou superior.
- npm.
- Antigravity IDE para desenvolvimento e validação da extensão.
- Google Chrome apenas para o teste manual de Native Messaging.

O VS Code não é requisito de desenvolvimento.

## Preparação

```powershell
npm ci
npm run verificar
```

Para trabalhar isoladamente:

```powershell
npm --workspace @argonauta/protocol test
npm --workspace @argonauta/compatibility-probe test
npm --workspace @argonauta/native-messaging-smoke test
npm --workspace @argonauta/integration-tests test
```

## Regras de contribuição

- Preserve o protocolo `1.0` e os hashes das fixtures.
- Mantenha TypeScript em modo estrito.
- Não introduza cookies, credenciais, tokens, scraping ou APIs privadas.
- Não execute comandos recebidos do navegador.
- Não abra portas ou interfaces de rede sem decisão arquitetural e autorização.
- Não modifique automaticamente o Registro do Windows.
- Inclua testes para mudanças comportamentais.
- Registre decisões arquiteturais relevantes em `docs/architecture/decisions/`.
- Use nomes estruturais em inglês e kebab-case; mantenha textos e mensagens em pt-BR quando não forem interfaces internacionais.

## Antes de propor integração

Execute:

```powershell
npm run typecheck
npm test
npm run verificar:fixtures
npm audit --audit-level=high
git diff --check
```

Testes manuais devem informar versão, sistema operacional, data e resultado `pass`, `fail`, `unsupported` ou `pending_manual_validation`.

## Escopo atual

Named Pipes, autenticação HMAC, automação do Gemini Web e aplicações definitivas não fazem parte desta refatoração. Consulte [ROADMAP.md](ROADMAP.md) antes de iniciar uma nova frente.
