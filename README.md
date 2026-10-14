<a id="english"></a>

<div align="center">
  <h1>⚓ Argonauta</h1>
  <p><strong>Navigate beyond the limits.</strong></p>
  <p>
    An open-source, security-first IDE extension for bringing reviewed code context to supported AI experiences.
  </p>
  <p>
    <a href="#portugues">🇧🇷 Leia em Português</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/status-discovery-7C3AED?style=for-the-badge" alt="Project status: discovery" />
    <img src="https://img.shields.io/badge/platform-Antigravity%20IDE--first-1F6FEB?style=for-the-badge" alt="Primary platform: Antigravity IDE" />
    <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript strict" />
    <img src="https://img.shields.io/badge/license-to%20be%20defined-6B7280?style=for-the-badge" alt="License: to be defined" />
  </p>
</div>

> [!WARNING]
> **Argonauta is in discovery.** There is no installable extension, validated Gemini Web integration, or autonomous agent at this stage. The project will only claim capabilities that are real, reproducible, secure, and allowed.

## ✨ About

Argonauta is an independent extension project designed first for **Antigravity IDE**. Its initial goal is to make a safer, more deliberate workflow possible: select code, review the context that may be shared, hand off a prompt to an AI experience, import a response, and review a patch before applying it.

The first release target is **Web Assisted**, not autonomous web automation. Gemini Web remains separate from the extension and is used through the user’s normal, legitimate session. Future support for VS Code or an official API-backed agent depends on tested host capabilities, public APIs, and applicable terms.

## 🧭 Product modes

| Mode | Purpose | Status |
| --- | --- | --- |
| **Web Assisted** | Review context, copy a prompt, open a supported browser flow, import a response, and inspect a diff. | Planned MVP |
| **Official API** | Use a documented provider API with the user’s own credentials, explicit costs, and approval gates. | Future, conditional |
| **Web Bridge** | Bidirectional integration with a web experience. | Research only; blocked until a public, allowed, and stable path is proven |

## 🛡️ Non-negotiable principles

- **No credential collection.** Argonauta will not request passwords, two-factor codes, session cookies, login tokens, or browser profiles.
- **Local-first and consent-based.** Code context is prepared locally; users inspect and approve what may leave the workspace.
- **No bypasses.** The project does not use private endpoints, session extraction, paywall circumvention, anti-bot evasion, or automation that violates platform controls.
- **Review before change.** Patches are previewed as diffs. File changes, terminal commands, and sensitive external access require explicit approval.
- **Truthful capabilities.** A web-assisted flow is not described as an autonomous agent. Unsupported hosts and failed experiments are documented as such.

<details>
<summary><strong>🔒 Security and privacy commitments</strong></summary>

<br />

- Exclude `.env` files, private keys, credentials, and configurable sensitive patterns from context by default.
- Refuse writes outside approved workspace roots and protect against path traversal and unsafe symlinks.
- Keep API keys, when supported, in the host’s secure storage — never in logs or project settings.
- Disable telemetry, analytics, and automatic workspace uploads by default.
- Treat workspace content and model output as untrusted data; never execute received commands or scripts without approval.

</details>

## 🚦 Current status

The project is at **M0 — Foundation / Discovery**. The immediate work is evidence gathering, not feature implementation.

- [x] Product requirements and discovery plan documented.
- [x] Initial compatibility matrix and project roadmap created.
- [x] Record Antigravity IDE host capabilities and versions.
- [x] Validate the available browser flow and document its limitations without credential interception.
- [x] Validate Chrome Native Messaging and the public extension APIs required by the bridge.
- [x] Freeze protocol `1.0`, binary fixtures, and robustness limits.
- [ ] Implement and validate the authorized local transport for POC-05B Stage 2.
- [ ] Decide the G1 and G3 gates before any claim of web automation.

## 🧪 Discovery gates

| Gate | What must be proven | Outcome |
| --- | --- | --- |
| **G1 — Usable web flow** | Gemini Web works in Antigravity IDE’s supported browser flow, or an external-browser fallback is viable. | Enables a Web Assisted experience. |
| **G2 — Useful manual MVP** | Context review, explicit handoff, patch import, diff review, consent, and basic tests work together. | Enables a transparent Web Assisted beta. |
| **G3 — Bidirectional integration** | A documented, testable, allowed, and compatible communication channel exists. | Only then may advanced synchronization be considered. |
| **G4 — Autonomous agent** | G3 is approved or an official API supports the necessary capabilities. | Enables correctly named agent features. |

## 🗺️ Roadmap

1. **Discovery** — test host and browser capabilities, document evidence, and decide the gates.
2. **Web Assisted prototype** — build approved-context handoff, response import, and diff review.
3. **Open-source beta** — add accessibility, guardrails, CI, documentation, and real host validation.
4. **Official API agent** — only with a documented provider, user-owned credentials, and explicit approval for sensitive actions.
5. **Web Bridge** — only if G3 proves the path is technically and contractually viable.

## 📚 Documentation

- [Product Requirements Document](PRD.md) — scope, safeguards, hypotheses, experiments, and acceptance criteria.
- [Roadmap](ROADMAP.md) — current phase, next delivery, and open decisions.
- [Compatibility matrix](docs/validation/compatibility-matrix.md) — evidence by host, version, operating system, and result.
- [Discovery implementation plan](.metadocs/implementation_plan/2026-10-14-discovery.md) — active validation plan.
- [Project history](HISTORY.md) — recorded milestones.
- [Architecture](docs/architecture/overview.md) — component boundaries and dependency direction.
- [Development guide](docs/development/getting-started.md) — setup and validation in Antigravity IDE.
- [Security model](docs/security/threat-model.md) — trust boundaries and residual risks.

## 🧱 Repository structure

- `apps/` — distributable applications, created only after product approval.
- `packages/` — reusable libraries with explicit dependencies.
- `tools/` — compatibility probes and reproducible technical validations.
- `tests/` — cross-project integration tests and shared fixtures.
- `docs/` — architecture, decisions, product documentation, and validation evidence.
- `scripts/` — shared development and platform automation.

## 🛠️ Development

Prerequisites: Windows, Node.js 20 or newer, npm, Google Chrome for the manual Native Messaging validation, and Antigravity IDE. VS Code is not required.

```powershell
npm ci
npm run typecheck
npm test
npm run verificar:fixtures
```

The automated baseline contains 77 tests. Chrome and Antigravity interactions remain manual validations and are never reported as CI successes. See the [development guide](docs/development/getting-started.md) for component-specific commands.

## 🤝 Using and contributing

There is no production extension to install yet. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes. Until the discovery gates are documented, the most valuable contribution is careful, reproducible evidence about supported hosts and public APIs.

Please do not build or propose integrations based on cookie extraction, private endpoints, browser profile access, DOM scraping, or attempts to bypass provider controls. Those approaches are outside the project’s scope.

## ⚖️ Disclaimer

Argonauta is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Google, Microsoft, Anthropic, or OpenAI. It is provided **as is**, without warranties. Users are responsible for complying with third-party terms, protecting their data, reviewing all shared context and generated patches, and deciding whether to apply any change.

---

<a id="portugues"></a>

<div align="center">
  <h1>⚓ Argonauta</h1>
  <p><strong>Navegue além dos limites.</strong></p>
  <p>
    Uma extensão open source, orientada à segurança, para levar contexto de código revisado a experiências de IA compatíveis.
  </p>
  <p>
    <a href="#english">🇺🇸 Read in English</a>
  </p>
</div>

> [!WARNING]
> **O Argonauta está em discovery.** Ainda não existe extensão instalável, integração validada com o Gemini Web ou agente autônomo. O projeto só comunicará capacidades reais, reproduzíveis, seguras e permitidas.

## ✨ Sobre

O Argonauta é um projeto de extensão independente, pensado primeiro para o **Antigravity IDE**. Seu objetivo inicial é viabilizar um fluxo mais seguro e deliberado: selecionar código, revisar o contexto que poderá ser compartilhado, transferir um prompt para uma experiência de IA, importar a resposta e revisar um patch antes de aplicá-lo.

O alvo da primeira versão é o modo **Web Assistido**, não a automação autônoma da web. O Gemini Web permanece separado da extensão e é usado pela sessão normal e legítima do usuário. O suporte futuro ao VS Code ou a um agente por API oficial depende de capacidades testadas do host, APIs públicas e termos aplicáveis.

## 🧭 Modos do produto

| Modo | Objetivo | Situação |
| --- | --- | --- |
| **Web Assistido** | Revisar contexto, copiar um prompt, abrir um fluxo de navegador compatível, importar uma resposta e inspecionar o diff. | MVP planejado |
| **API Oficial** | Usar API documentada de um provedor com credenciais próprias, custos explícitos e aprovações. | Futuro e condicionado |
| **Web Bridge** | Integração bidirecional com uma experiência web. | Apenas pesquisa; bloqueada até haver caminho público, permitido e estável |

## 🛡️ Princípios inegociáveis

- **Sem coleta de credenciais.** O Argonauta não solicitará senhas, códigos de dois fatores, cookies de sessão, tokens de login ou perfis de navegador.
- **Local-first e baseado em consentimento.** O contexto é preparado localmente; o usuário inspeciona e aprova o que poderá sair do workspace.
- **Sem contornos.** O projeto não usa endpoints privados, extração de sessão, evasão de paywalls ou anti-bot, nem automação que viole controles de plataforma.
- **Revisão antes da mudança.** Patches são pré-visualizados como diffs. Alterações em arquivos, comandos de terminal e acessos externos sensíveis exigem aprovação explícita.
- **Capacidades verdadeiras.** Um fluxo web assistido não será apresentado como agente autônomo. Hosts não suportados e experimentos que falharem serão documentados como tal.

<details>
<summary><strong>🔒 Compromissos de segurança e privacidade</strong></summary>

<br />

- Excluir `.env`, chaves privadas, credenciais e padrões sensíveis configuráveis do contexto por padrão.
- Recusar escritas fora das raízes aprovadas do workspace e proteger contra path traversal e symlinks inseguros.
- Armazenar chaves de API, quando houver suporte, no armazenamento seguro do host — nunca em logs ou configurações do projeto.
- Desativar telemetria, analytics e envio automático de dados do workspace por padrão.
- Tratar o conteúdo do workspace e as respostas do modelo como dados não confiáveis; nunca executar comandos ou scripts recebidos sem aprovação.

</details>

## 🚦 Estado atual

O projeto está em **M0 — Fundação / Discovery**. O trabalho imediato é coletar evidências, não implementar funcionalidades.

- [x] PRD e plano de discovery documentados.
- [x] Matriz inicial de compatibilidade e roadmap criados.
- [x] Registrar capacidades e versões do host Antigravity IDE.
- [x] Validar o fluxo de navegador disponível e documentar suas limitações sem interceptar credenciais.
- [x] Validar Chrome Native Messaging e as APIs públicas da extensão necessárias à ponte.
- [x] Congelar protocolo `1.0`, fixtures binárias e limites de robustez.
- [ ] Implementar e validar o transporte local autorizado da Etapa 2 da POC-05B.
- [ ] Decidir os gates G1 e G3 antes de qualquer alegação de automação web.

## 🧪 Gates de discovery

| Gate | O que precisa ser comprovado | Resultado |
| --- | --- | --- |
| **G1 — Fluxo web utilizável** | Gemini Web funciona no fluxo de navegador suportado pelo Antigravity IDE, ou há fallback viável no navegador externo. | Habilita uma experiência Web Assistido. |
| **G2 — MVP manual útil** | Revisão de contexto, transferência explícita, importação de patch, revisão de diff, consentimento e testes básicos funcionam em conjunto. | Habilita um beta Web Assistido transparente. |
| **G3 — Integração bidirecional** | Existe um canal documentado, testável, permitido e compatível. | Somente então poderá ser considerada sincronização avançada. |
| **G4 — Agente autônomo** | G3 foi aprovado ou uma API oficial oferece as capacidades necessárias. | Habilita funcionalidades de agente corretamente nomeadas. |

## 🗺️ Roadmap

1. **Discovery** — testar capacidades do host e do navegador, documentar evidências e decidir os gates.
2. **Protótipo Web Assistido** — criar transferência de contexto aprovado, importação de resposta e revisão de diff.
3. **Beta open source** — adicionar acessibilidade, guardrails, CI, documentação e validação real nos hosts anunciados.
4. **Agente via API oficial** — somente com provedor documentado, credenciais do usuário e aprovação explícita para ações sensíveis.
5. **Web Bridge** — somente se G3 provar viabilidade técnica e contratual.

## 📚 Documentação

- [Documento de Requisitos do Produto](PRD.md) — escopo, salvaguardas, hipóteses, experimentos e critérios de aceite.
- [Roadmap](ROADMAP.md) — fase atual, próxima entrega e decisões em aberto.
- [Matriz de compatibilidade](docs/validation/compatibility-matrix.md) — evidências por host, versão, sistema operacional e resultado.
- [Plano de implementação de discovery](.metadocs/implementation_plan/2026-10-14-discovery.md) — plano de validação ativo.
- [Histórico do projeto](HISTORY.md) — marcos registrados.
- [Arquitetura](docs/architecture/overview.md) — fronteiras dos componentes e direção das dependências.
- [Guia de desenvolvimento](docs/development/getting-started.md) — setup e validação no Antigravity IDE.
- [Modelo de segurança](docs/security/threat-model.md) — limites de confiança e riscos residuais.

## 🧱 Estrutura do repositório

- `apps/` — aplicações distribuíveis, criadas somente após aprovação de produto.
- `packages/` — bibliotecas reutilizáveis com dependências explícitas.
- `tools/` — probes de compatibilidade e validações técnicas reproduzíveis.
- `tests/` — testes de integração entre projetos e fixtures compartilhadas.
- `docs/` — arquitetura, decisões, documentação de produto e evidências de validação.
- `scripts/` — automações compartilhadas de desenvolvimento e plataforma.

## 🛠️ Desenvolvimento

Pré-requisitos: Windows, Node.js 20 ou superior, npm, Google Chrome para a validação manual de Native Messaging e Antigravity IDE. O VS Code não é necessário.

```powershell
npm ci
npm run typecheck
npm test
npm run verificar:fixtures
```

A linha de base automatizada contém 77 testes. As interações com Chrome e Antigravity continuam sendo validações manuais e nunca são apresentadas como sucesso de CI. Consulte o [guia de desenvolvimento](docs/development/getting-started.md) para os comandos específicos de cada componente.

## 🤝 Uso e contribuições

Ainda não há extensão de produção disponível para instalação. Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de propor alterações. Até que os gates de discovery sejam documentados, a contribuição mais valiosa é produzir evidências cuidadosas e reproduzíveis sobre hosts compatíveis e APIs públicas.

Não implemente nem proponha integrações baseadas em extração de cookies, endpoints privados, acesso a perfis de navegador, DOM scraping ou tentativas de contornar controles de provedores. Essas abordagens estão fora do escopo do projeto.

## ⚖️ Isenção de responsabilidade

O Argonauta é um projeto open source independente e não possui afiliação, endosso ou patrocínio do Google, Microsoft, Anthropic ou OpenAI. Ele é fornecido **no estado em que se encontra**, sem garantias. O usuário é responsável por cumprir termos de terceiros, proteger seus dados, revisar todo contexto compartilhado e patch gerado e decidir se aplicará qualquer alteração.
