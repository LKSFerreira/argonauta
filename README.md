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
> **Argonauta is transitioning from initial discovery to extension implementation.** The active priority is implementing the real IDE extension in `apps/ide-extension/`, centered on an agentic experience and an installable `.vsix` package. Direct connection to a model provider is an explicit external dependency; Gemini Web integration remains an unproven hypothesis.

## ✨ About

Argonauta is an independent extension project designed first for **Antigravity IDE**. Its goal is to provide a complete agentic coding experience directly within the IDE: a dedicated Activity Bar icon, integrated chat/agent panel, local context curation, plan tracking, authorized tool execution, and diff-based patch review before changes touch the workspace.

The delivery priority is the real extension package (`.vsix`) in `apps/ide-extension/`, usable through the IDE interface. Connecting to a real model is treated as an explicit, decoupled dependency without simulating fake agents or mock chats. The **Web Assisted** mode is maintained as an explicit manual context-and-response handoff fallback when direct model connection is unavailable, rather than as a substitute for the agentic extension itself.

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

## 🗺️ Roadmap and Project Status

Argonauta is built through a disciplined, evidence-based engineering process. To prevent broken promises, security risks, or unviable integrations, every capability progresses through strict **Discovery Gates** and automated/manual validation steps before implementation.

Developers and contributors can follow the exact construction of the application, including current phases, completed POCs, validated test reports, and future milestones in the [**Roadmap (ROADMAP.md)**](ROADMAP.md).


## 📚 Documentation

- [Product Requirements Document](PRD.md) — scope, safeguards, hypotheses, experiments, and acceptance criteria.
- [Roadmap](ROADMAP.md) — engineering progression, discovery gates, phase traceability, and current validation status.
- [Compatibility matrix](docs/validation/compatibility-matrix.md) — evidence by host, version, operating system, and result.
- [Discovery implementation plan](.metadocs/implementation_plan/2026-10-14-discovery.md) — active validation plan.
- [Project history](HISTORY.md) — recorded milestones.
- [Architecture](docs/architecture/overview.md) — component boundaries and dependency direction.
- [Development guide](docs/development/getting-started.md) — setup and validation in Antigravity IDE.
- [Security model](docs/security/threat-model.md) — trust boundaries and residual risks.

## 🧱 Repository structure

- `apps/` — distributable applications, starting with the core IDE extension (`apps/ide-extension/`).
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

The current focus is building and validating the installable `.vsix` package in `apps/ide-extension/`. Generating a local `.vsix` is a concrete technical delivery, whereas public marketplace release (Open VSX / VS Code Marketplace) requires subsequent publisher identity, licensing, and platform homologation. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.

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
> **O Argonauta está em transição do discovery para a implementação da extensão.** A prioridade ativa é a construção da extensão real em `apps/ide-extension/`, centrada em uma experiência agêntica e em um pacote `.vsix` instalável. A conexão direta com um provedor de modelo é uma dependência externa explícita; a integração com o Gemini Web permanece como uma hipótese não comprovada.

## ✨ Sobre

O Argonauta é um projeto de extensão independente, concebido primeiro para o **Antigravity IDE**. Seu objetivo é fornecer uma experiência agêntica completa de programação integrada à interface da IDE: ícone próprio na Activity Bar, painel integrado de agente/chat, curadoria local de contexto, acompanhamento de planos, execução de ferramentas autorizadas e revisão de alterações em formato diff antes de qualquer modificação no workspace.

A prioridade de entrega é a implementação da extensão real (`apps/ide-extension/`) empacotada em `.vsix` instalável pela interface da IDE. A conexão efetiva com um provedor de inferência é tratada como dependência explícita e desacoplada, sem simulações cosméticas de agente. O modo **Web Assistido** permanece como um fallback manual seguro para transferência de contexto e respostas quando não houver conexão direta com modelos, e não como teto ou definição limitante do produto.

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

## 🗺️ Roadmap e Construção da Aplicação

O Argonauta é construído por meio de um processo rigoroso de engenharia guiado por evidências. Para evitar falsas promessas, riscos de segurança ou integrações inviáveis, cada funcionalidade passa por **Gates de Discovery** e etapas estruturadas de validação manual e automatizada antes da implementação definitiva.

Qualquer desenvolvedor pode acompanhar detalhadamente **como a aplicação está sendo construída**, quais experimentos foram validados, as decisões arquiteturais congeladas e os próximos marcos no [**Roadmap Oficial (ROADMAP.md)**](ROADMAP.md).

## 📚 Documentação

- [Documento de Requisitos do Produto](PRD.md) — escopo, salvaguardas, hipóteses, experimentos e critérios de aceite.
- [Roadmap](ROADMAP.md) — rastreabilidade da construção, gates de discovery, fases do projeto e evidências técnicas.
- [Matriz de compatibilidade](docs/validation/compatibility-matrix.md) — evidências por host, versão, sistema operacional e resultado.
- [Plano de implementação de discovery](.metadocs/implementation_plan/2026-10-14-discovery.md) — plano de validação ativo.
- [Histórico do projeto](HISTORY.md) — marcos registrados.
- [Arquitetura](docs/architecture/overview.md) — fronteiras dos componentes e direção das dependências.
- [Guia de desenvolvimento](docs/development/getting-started.md) — setup e validação no Antigravity IDE.
- [Modelo de segurança](docs/security/threat-model.md) — limites de confiança e riscos residuais.

## 🧱 Estrutura do repositório

- `apps/` — aplicações distribuíveis, iniciando pela extensão principal da IDE (`apps/ide-extension/`).
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

O foco imediato de implementação é a construção e validação do pacote `.vsix` em `apps/ide-extension/`. A geração do `.vsix` instalável é uma entrega técnica concreta, enquanto a publicação oficial em lojas (Open VSX / Visual Studio Marketplace) exige etapas posteriores de titularidade, identidade de publicador e homologação. Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de propor alterações.

Não implemente nem proponha integrações baseadas em extração de cookies, endpoints privados, acesso a perfis de navegador, DOM scraping ou tentativas de contornar controles de provedores. Essas abordagens estão fora do escopo do projeto.

## ⚖️ Isenção de responsabilidade

O Argonauta é um projeto open source independente e não possui afiliação, endosso ou patrocínio do Google, Microsoft, Anthropic ou OpenAI. Ele é fornecido **no estado em que se encontra**, sem garantias. O usuário é responsável por cumprir termos de terceiros, proteger seus dados, revisar todo contexto compartilhado e patch gerado e decidir se aplicará qualquer alteração.
