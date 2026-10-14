# ⚓ Argonauta — ROADMAP mestre de produto, engenharia e rastreabilidade

> **Versão proposta:** 2.0.0 — consolidação arquitetural para aprovação do mantenedor  
> **Data-base:** 14 de outubro de 2026  
> **Projeto:** [Argonauta](https://github.com/LKSFerreira/argonauta) — Antigravity IDE-first  
> **Estado global:** `M0 — Foundation & Discovery`, com fundação e contratos aprovados, ponte IPC bloqueada em gate de segurança relatado, e MVP Web Assistido ainda não implementado.  
> **Baseline pública consultada:** `main` em `62806b8655996773deae9e660bd46653d841fa57`; CI Windows `success` ([execução](https://github.com/LKSFerreira/argonauta/actions/runs/38581539993)).  
> **Natureza deste documento:** **proposta de substituição do ROADMAP atual**, não um commit realizado. Os estados informados em documentos locais mais recentes que a `main` estão explicitamente identificados como *relatados*.

## 0. Contrato de continuidade: a bússola não pode ser reescrita a cada conversa

Este documento é o **mapa mestre estável** do Argonauta. Ele existe para preservar a visão completa do produto, seus objetivos, decisões, marcos, gates, dependências e critérios de conclusão ao longo de conversas com assistentes, sessões de agentes e mudanças de mantenedores.

O `PRD.md` define **o que o produto deve fazer**. Este `ROADMAP.md` define **aonde vamos, em que ordem lógica e como se comprova o progresso**. Os ADRs documentam **por que determinadas escolhas técnicas foram feitas**. Relatórios em `docs/validation/` registram **o que foi realmente testado**. `HISTORY.md` registra **o que aconteceu**. Um arquivo de handoff, como `memory.md`, transfere o contexto entre conversas e **não substitui** nenhum desses documentos.

### Hierarquia fixa e não intercambiável

1. **Seis marcos de maturidade do produto, M0–M5:** preservados do roadmap e do PRD existentes.
2. **Nove trilhas permanentes de execução, T01–T09:** nova organização proposta neste documento, cobrindo todos os marcos e impedindo que tarefas desapareçam quando a POC muda. **Não são apresentadas como recuperação literal de uma suposta lista histórica de nove etapas, cuja versão original não foi localizada.**
3. **POCs e subetapas, com identificadores próprios:** por exemplo, POC-05B tem **sete etapas técnicas (0–6)**; elas não devem ser confundidas com M0–M5 nem com T01–T09.
4. **Gates de decisão, G0–G5:** definem aprovação/bloqueio técnico, funcional, contratual e de publicação.
5. **Tarefas e evidências:** mudanças locais, commits, CI, testes reais e relatórios.

Uma POC pode ser bloqueada sem bloquear automaticamente a próxima entrega de produto, desde que a entrega não dependa tecnicamente dela. Em particular: **o MVP Web Assistido não exige POC-05B, HMAC, Chrome Native Messaging persistente nem Gate G3 aprovado.**

### Semântica obrigatória dos estados

| Estado | Significado |
|---|---|
| `done` | Implementação/decisão concluída, com evidência de aceite identificada. |
| `in_progress` | Trabalho iniciado; critérios ainda incompletos. |
| `planned` | Escopo aprovado em princípio, implementação não iniciada. |
| `proposed` | Candidato a decisão; depende de aprovação ou detalhamento. |
| `blocked` | Impedimento impede concluir com segurança ou legitimidade. |
| `pending_validation` | Implementado ou relatado, mas falta teste/evidência obrigatória. |
| `conditional` | Só pode começar após gate ou condição expressa. |
| `unsupported` | Capacidade não disponível no ambiente testado. |
| `rejected` | Alternativa descartada por decisão documentada. |

Um checkbox `[x]` só será usado quando os critérios de aceitação correspondentes tiverem evidências suficientes. Teste automatizado não equivale a teste manual. Relatório do agente não é auditoria independente. GitHub Actions não valida o Chrome ou o Antigravity IDE interativamente.

---

## 1. Norte permanente: visão, usuários e limites

### 1.1 Visão

Criar uma extensão **open source** de assistência e, quando legitimamente possível, agência de programação **desenvolvida e validada primeiro no Google Antigravity IDE**, com segurança local, controle do contexto compartilhado, revisão de modificações e arquitetura de provedores substituíveis.

A motivação inicial foi a diferença observada entre a disponibilidade do modelo **Gemini 4 Argon** no Gemini Web para uma conta Google AI Pro e a disponibilidade apresentada nas interfaces de agente da IDE/CLI. Essa observação **não** significa que a assinatura Pro conceda créditos de API, autorize automação web ou permita contornar níveis de acesso.

**Objetivo do produto:** melhorar o trabalho do desenvolvedor com contexto, assistência, revisão e fluxos de IA. **Hipótese de pesquisa de alto risco:** usar Gemini Web como parte de um agente bidirecional/autônomo por mecanismo público, confiável e permitido. Se essa hipótese falhar, Argonauta deve continuar útil por **Web Assistido** e, condicionalmente, **API oficial**.

### 1.2 Usuário e plataforma prioritários

- Ambiente de **desenvolvimento, depuração e validação do mantenedor:** **Antigravity IDE em Windows**, não VS Code.
- Biblioteca de tipos compatível com VS Code pode ser utilizada como SDK, sem exigir o aplicativo VS Code.
- Compatibilidade com VS Code, Linux e macOS **não é presumida**, somente anunciada após testes próprios.
- Distribuição planejada: **Open VSX primeiro**, Visual Studio Marketplace somente após homologação real e análise das respectivas políticas.

### 1.3 Três modos de produto, com promessas separadas

| Modo | O que entrega | Fronteira de honestidade | Marco |
|---|---|---|---|
| **Web Assisted** | Seleção de contexto, revisão, preparação/cópia de prompt, abertura do navegador legítimo, importação explícita de resposta e revisão de diff. | Não afirma streaming, leitura da página, sincronização automática nem agent loop web. | M1, amadurecido em M2 |
| **Official API Agent** | Backend de API pública/documentada, chave própria do usuário, streaming/tool calling quando disponíveis, ferramentas sujeitas a autorização. | Google AI Pro não é tratado como licença ou faturamento da Gemini API. | M3, condicional |
| **Web Bridge** | Comunicação IDE ↔ Chrome e possível integração bidirecional com experiência web, **somente se pública e permitida**. | Uma ponte IPC funcional não autoriza acesso ao Gemini Web. Nenhum cookie/token/sessão extraído. | M4, condicional |

### 1.4 Princípios não negociáveis

- **Verdade técnica:** só anunciar funcionalidades demonstradas no host real.
- **Consentimento:** contexto e alterações devem ser revisados antes de sair do workspace ou afetar arquivos.
- **Segurança por padrão:** mínimo privilégio, schema estrito, limites de recurso, Workspace Trust, restrições de caminho e symlinks, proteção contra prompt injection.
- **Privacidade:** nunca solicitar senhas, códigos 2FA, cookies, tokens de login, perfis de navegador ou credenciais de sessão. Nenhuma telemetria e nenhum upload automático por padrão.
- **Conformidade:** nada de APIs privadas, scraping não autorizado, bypass de CSP, CAPTCHA, paywall, restrições de assinatura ou anti-bot.
- **Arquitetura profissional:** TypeScript estrito, código modular, limites explícitos, testes, CI, ADRs e nomenclatura estrutural consistente. Não voltar a diretórios genéricos `experiments/` ou criar aplicativos vazios.
- **Execução responsável:** agente não publica commits/push/PR nem modifica o Registro do Windows sem autorização explícita.
- **Falha como evidência:** um experimento bloqueado deve permanecer documentado, não ser maquiado como sucesso.

---

## 2. Mapa geral de marcos: M0–M5

Estes identificadores são **permanentes**; não renumerar os marcos a cada sprint.

| Marco | Entrega de valor | Estado em 14/10/2026 | Gate fundamental | Pode ocorrer em paralelo? |
|---|---|---|---|---|
| **M0 — Foundation & Discovery** | Base de engenharia, entendimento do host, POCs, contrato, riscos e decisões. | `in_progress`; infraestrutura validada, POC-05B ainda incompleta. | G0; decisões específicas por POC. | Sim, com planejamento do M1. |
| **M1 — Web Assisted MVP** | Extensão útil no Antigravity sem automação web: contexto → prompt → resposta → diff. | `planned` | G1 em nível compatível com o fluxo escolhido; G2 para concluir. | **Sim. Não depende de POC-05B ou G3.** |
| **M2 — Open-source Beta** | Usabilidade, testes, segurança, empacotamento e validação com usuários. | `planned` | MVP funcional e requisitos de beta. | Preparação pode começar durante M1. |
| **M3 — Official API Agent** | Provedor oficial, chaves próprias, streaming, ferramentas autorizadas. | `conditional` | Documentação/API/conta/faturamento legítimos; G4 para autonomia. | Trilha paralela pós-núcleo do produto. |
| **M4 — Web Bridge** | Ponte contínua **e** integração web legitimamente viável. | `conditional`, alto risco | **G3 técnico + G3 web/contratual**; G4 se houver agent loop. | Pesquisa de viabilidade pode ser paralela, implementação é condicionada. |
| **M5 — Publicação e manutenção** | Identidade/licença, releases, Open VSX, suporte e governança. | `planned` | G5 e homologação da plataforma anunciada. | Preparação antecipada; publicação após critérios. |

**Sequência mínima de valor:** M0 (fundação suficiente) → M1 → M2 → M5 (lançamento do modo Web Assisted). M3 e M4 são caminhos **opcionais/condicionais**, e **não** barreiras para lançar o Web Assisted.

---

## 3. As nove trilhas permanentes do projeto: T01–T09

Esta é uma **nova taxonomia proposta para manter a rastreabilidade das nove grandes frentes de construção**. Ela complementa, em vez de substituir, os seis marcos históricos.

| ID | Trilha permanente | Marcos atendidos | Situação | Critério de conclusão da trilha |
|---|---|---|---|---|
| **T01** | Governança, arquitetura e fundamentos | M0, M2, M5 | Parcialmente `done`; manutenção contínua | ADRs, workspace, CI, segurança, licença, políticas e releases verificáveis. |
| **T02** | Discovery do navegador, capacidades e legitimidade | M0, M1, M4 | `in_progress` | G1 fundamentado, limitações do Jetski registradas e decisão G3 web sem suposições. |
| **T03** | Ponte técnica IDE ↔ host ↔ Chrome | M0, M4 | `blocked` na Etapa 2, conforme **anexo do usuário**; revisão independente pendente | POC-05B 0–6 aprovada, com ACL, autenticação e E2E, sem acesso ao Gemini. |
| **T04** | Núcleo da extensão Antigravity e UX | M1, M2 | `planned` | Comandos, painel, estado do provedor, storage, erros, temas, acessibilidade. |
| **T05** | Contexto local, privacidade e consentimento | M1, M2 | `planned` | Seleção, exclusões, filtros de segredos, prévia e aprovação de cada compartilhamento. |
| **T06** | Handoff, importação de respostas e revisão de patches | M1, M2 | `planned` | Prompt revisado/copiado, resposta importada, diff seguro, aplicação somente autorizada. |
| **T07** | Agente por API oficial | M3 | `conditional` | API oficial, BYOK, limites/custos, capacidades reais, ferramentas e aprovações. |
| **T08** | Web Bridge com integração permitida | M4 | `conditional`; G3 não aprovado | Ponte reutilizada somente se houver interface web documentada/permitida e testes. |
| **T09** | Qualidade de distribuição, comunidade e manutenção | M2, M5 | `planned` | VSIX, revisão de licença, Open VSX, homologação, documentação, governança e atualização segura. |

**Regras:** `T03` é infraestrutura exploratória; **não** substitui T04–T06. `T08` é diferente de T03: passar a ponte de transporte não autoriza integração com páginas do Google. T09 não é postergado integralmente até M5; parte da qualidade é construída em cada marco.

### Relações e caminho crítico

```text
                       ┌── T03 / POC-05B / IPC ── bloqueio de segurança ──┐
M0: T01 + T02 ─────────┤                                                 ├─> T08 / M4
                       └─> T04 + T05 + T06 ──> M1 ──> M2 / T09 ──> M5   │
                                                     └─> T07 / M3 ───────┘
```

O desenho indica **trilhas**, não a aprovação automática de conexões. T07 pode gerar autonomia por API oficial sem T08. O início de T04–T06 não depende do desbloqueio de T03.

---

## 4. Discovery Gates — G0 a G5, com prova verificável

| Gate | Pergunta | Prova e aceitação | Estado |
|---|---|---|---|
| **G0 — Discovery** | Host, necessidades, hipóteses e riscos estão identificados? | PRD, matriz, requisitos e plano de experimentos. | `done` para iniciar pesquisa; discovery permanece contínuo. |
| **G1 — Fluxo Web Utilizável** | O usuário consegue efetivamente realizar o fluxo web normal em navegador suportado? | Abrir Gemini Web por sessão legítima; conseguir conversar/interagir normalmente; registrar host/data, sem acessar credenciais. Fallback externo é suficiente para Web Assisted. | **`pending_validation` para o fluxo completo do MVP.** O anexo declara Chrome externo aprovado, mas o PONG do Native Messaging **não é** prova de conversa Gemini. Validar/ligar a evidência específica. |
| **G2 — MVP Manual Útil** | O fluxo contexto → prompt → Gemini Web normal → importação → diff/aplicação segura é útil? | POC-06 e M1 concluídos, consentimento, testes e avaliação manual no Antigravity. | `planned`. |
| **G3 — Integração Bidirecional Permitida** | Existe um caminho técnico **e contratualmente permitido** de integração com o serviço web de terceiros? | **G3-T:** transporte local autenticado com DACL/identidade, Chrome Native Messaging persistente e E2E; **G3-W:** mecanismo público/documentado, autorização real, limites e termos aplicáveis ao Gemini Web. **Ambos** obrigatórios para Web Bridge. | `blocked/pending` em G3-T pelo IPC; **G3-W não validado**. |
| **G4 — Agente Autônomo** | Existe provedor habilitado e orquestrador seguro para múltiplas ações? | API oficial **ou** Web Bridge que passou G3; tool calling real, permissões, aprovações, prompt-injection tests, rollback. | `conditional`. |
| **G5 — Publicação** | Existe release transparente, testada, licenciada e compatível? | Licença/publisher, segurança, VSIX, documentação, testes, compatibilidade e políticas da loja. | `planned`. |

**Decisões independentes essenciais:**
- **G3-T** valida o *canal*; **G3-W** valida a *possibilidade e legitimidade de usá-lo com Gemini Web*. Não declarar G3 aprovado após apenas uma mensagem IDE ↔ Chrome.
- **G4 pode ser aprovado pela rota API oficial mesmo se G3-W falhar**.
- **G1 não exige DOM, API privada nem sincronização**; exige um navegador real utilizável para o usuário.
- Falha definitiva de G3-W implica **encerrar T08** e manter M1/M2/M3/M5 viáveis.

---

## 5. M0 — Fundação, POCs e decisões (T01, T02, T03)

### 5.1 Baseline de engenharia: concluída

- [x] `PRD.md`, `README.md`, `AGENTS.md`, `HISTORY.md`, `ROADMAP.md`, `SECURITY.md`, `CONTRIBUTING.md`.
- [x] Monorepo TypeScript com npm workspaces, TypeScript `strict`, lockfile e workspaces por responsabilidade.
- [x] ADR-0001, threat model inicial, documentação de arquitetura/desenvolvimento/validação.
- [x] CI Windows com `npm ci`, typecheck, suítes, fixtures e auditoria de dependências.
- [x] Regressões existentes: **77 testes** (46 protocol, 7 integração, 11 probe, 13 Native Messaging) no snapshot público inspecionado.
- [x] Fixtures PING/PONG byte a byte estáveis, verificadas por SHA-256.
- [x] Probe manual Antigravity repetido após migração: **9 PASS, 0 FAIL, 0 UNSUPPORTED**.
- [x] Chrome manual repetido após migração: **PONG recebido**, protocolo `1.0`, host `0.1.0`.
- [ ] Proteção da branch principal e política consistente de PR/CI, a ser decidida.
- [ ] Licença MIT ou Apache-2.0 escolhida pelo mantenedor (obrigatória antes de publicar, não instalar silenciosamente).
- [ ] Publisher/namespace e análise de marca.
- [ ] CI expandido apenas conforme as plataformas forem suportadas; **hoje o job aprovado é Windows**, não uma matriz Linux/macOS.

### 5.2 Experimentos de discovery

| POC | Finalidade | Evidência e decisão |
|---|---|---|
| **POC-01** | Inventário host e Jetski Preview | `done` para conectividade simples; `example.com` abriu no integrado. |
| **POC-02** | Gemini Web no integrado | Falha observada: tela branca na URL correta, 403 em outro teste; causa-raiz não provada. Não contornar controles. |
| **POC-03** | Disponibilidade/interação Argon | Disponibilidade observada pelo usuário no Gemini Web; conversa e compatibilidade por host precisam de evidência de gate apropriada. |
| **POC-04** | Portabilidade VS Code | Posterior/opcional; não bloquear Antigravity. |
| **POC-05** | Fronteira pública extensão ↔ navegador | Pesquisa técnica e contratual incompleta; Chrome Native Messaging não substitui comprovação Gemini Web. |
| **POC-05A** | Chrome MV3 ↔ Native Host Node.js via stdio | `done`: PING/PONG 1.0 real, 13 testes e repetição manual após migração. |
| **POC-05B** | Antigravity ↔ host ↔ Chrome, autenticado e ponta a ponta | `in_progress` com **Etapa 2 bloqueada segundo relatório anexado**. |
| **POC-06** | MVP de contexto, prompt, importação de resposta e diff | `planned`; pertence à realização de M1. |
| **POC-07** | Provider oficial via API própria | `conditional`/opcional; não depende de cookie nem da assinatura AI Pro. |

### 5.3 POC-05B: subplano técnico fixo de sete etapas (0–6)

**Estas sete etapas não são as nove trilhas T01–T09 nem os seis marcos M0–M5.**

| Etapa | Objetivo | Estado | Gate de saída |
|---|---|---|---|
| **0 — Compatibility Probe** | Extensão no Antigravity, APIs públicas, Node local, `node:net`, `node:crypto`, `SecretStorage`. | `done` | 9/9 checks manuais e suíte do probe. |
| **1 — Protocol & Framing** | Schemas fechados, framing, limites, decoder seguro, fixtures e compatibilidade. | `done` | 46 testes do pacote + 7 integração, hashes preservados. |
| **2 — Windows Named Pipe Transport** | Canal duplex IDE↔Node com ACL e bloqueio remoto comprovados, buffers/timeout/backpressure. | **`blocked` relatado no anexo; auditoria do ADR/evidências pendente.** | DACL efetiva restrita, clientes não autorizados/remotos bloqueados, testes negativos, segurança sem suposições. |
| **3 — Mutual Authentication** | Provisionamento protegido e HMAC-SHA256 host-first, anti-replay, autenticação mútua. | `conditional`, não autorizada | Transcript canônico, test vectors, comparação em tempo constante, segredo protegido, testes de replay. |
| **4 — Persistent Chrome Native Messaging** | Novo host `com.argonauta.poc05b`, Chrome MV3 `connectNative()`, conexão manual e lifecycle. | `conditional` | Porta persistente funcional, origem fixa, reconexão controlada, nenhuma permissão extra indevida. |
| **5 — End-to-end Routing** | Comando `Argonauta: Test Bridge`, TESTAR_PONTE/PONTE_TESTADA, correlação/timeouts. | `conditional` | IDE → host → Chrome → host → IDE com evidência real e segurança. |
| **6 — Evidence & Closure** | Testes reais, reinício, falhas, regressão, limpeza, documentação e decisão. | `conditional` | Relatório reproduzível, sem processos órfãos, sem POC-05A regressiva; aprovação formal. |

**Congelamento do protocolo POC-05B:**
- versão de mensagens `1.0`;
- prefixo `uint32` em ordem nativa, **little-endian nas fixtures Windows**;
- JSON UTF-8 com payload máximo de **65.536 bytes**;
- fragmento padrão máximo de **65.540 bytes** para o decodificador existente;
- até **32 mensagens** por `adicionar()` e inspeção estrutural iterativa até **64 níveis**;
- rejeitar getters, setters, proxies, `toJSON`, protótipos inadequados, ciclos e funções antes de serializar;
- duas variantes de `TESTAR_PONTE` devem ser autorizadas por **direção**, não apenas validadas por schema.

Fixtures:
- PING SHA-256: `414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd`
- PONG SHA-256: `4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392`

### 5.4 Bloqueio atual de IPC: evidência relatada e próxima decisão

**O anexo fornecido pelo mantenedor declara** que experimentos locais demonstraram que `node:net`, na configuração testada, criou Named Pipe com DACL permissiva (`Everyone`/`Anonymous` com leitura) e permitiu conexão por `\\localhost\pipe`; por isso, a Etapa 2 foi classificada como `blocked`. O anexo referencia:
- `docs/architecture/decisions/0002-node-net-security-gate.md`
- `docs/validation/ipc-transport.md`
- comando `npm run verificar:ipc-security-gate`

**Limitação de verificação:** esses artefatos **não constavam do HEAD `62806b8` na `main` pública** ao preparar esta proposta. Assim, **o bloqueio permanece mantido por prudência**, mas a causa detalhada e os testes não foram auditados independentemente aqui. Não marcar DACL como comprovadamente vulnerável em qualquer versão do Node sem examinar o relatório exato.

**Decisão necessária, antes de liberar a implementação completa de `packages/ipc`:**
1. Obter o branch/diff/ADR-0002 e relatório com SDDL sanitizado, versões do Windows/Node, nome do pipe e provas de acesso remoto.
2. Reproduzir ou revisar criticamente os testes negativos, incluindo condições de execução e privilégios.
3. Comparar alternativas com APIs **públicas** do Windows. Se indispensável, propor helper mínimo Win32 com **descritor de segurança explícito** e restrição remota (como `PIPE_REJECT_REMOTE_CLIENTS`) — dependências/build/assinatura/manutenção sujeitos a aprovação específica.
4. **Não** implementar helper nativo, instalar binários ou criar serviço/Registro automaticamente sem autorização; **não** substituir Named Pipe por TCP silenciosamente.
5. Se requisitos permanecerem inviáveis, registrar bloqueio durável e reavaliar esta trilha sem impedir M1.

### 5.5 Limites do laboratório

A POC-05A é um **smoke test**, não host de produção. Ela continua em `tools/native-messaging-smoke/` com `com.argonauta.poc05a` e identidade Chrome `kmhnfligldbfbjmdmodckpmbnfmehfba`. A Etapa 4 futura utilizará identidade/host distintos e não deve quebrar a POC-05A.

`@argonauta/protocol` é independente de transporte, mas sua **implementação usa Node.js** (`Buffer`, `node:util`); não assumir importação direta no service worker do Chrome.

Nenhuma POC autoriza leitura de DOM, cookies, sessões do Google, comando de shell ou conteúdo do workspace.

---

## 6. M1 — MVP Web Assisted: primeira experiência realmente utilizável (T04, T05, T06)

**Estado:** `planned`. **Não requer aprovação de G3 nem conclusão da POC-05B.**

### 6.1 Núcleo e painel da IDE — T04

- [ ] Criar `apps/ide-extension/` **quando a extensão real for implementada**. Não converter `tools/compatibility-probe` em produto por renomeação cosmética.
- [ ] Detectar capacidades reais do Antigravity, Workspace Trust, lifecycle e modo local/remoto.
- [ ] `Argonauta: Open` abre painel próprio, estado vazio e navegação básica.
- [ ] `Argonauta: Ask About Selection` aciona fluxo a partir de seleção no editor.
- [ ] UI com modos visíveis `Web Assisted`, `Official API` (indisponível se não implementado) e `Web Bridge` (experimental/bloqueado se aplicável).
- [ ] Área de conversa/atividade **local**, sem fingir sincronização automática com Gemini Web.
- [ ] Histórico local opcional, política de retenção e comando de limpeza.
- [ ] First-run Disclaimer com confirmação antes de ações externas, conforme FR-08b do PRD.
- [ ] Erros claros, cancelamento, acessibilidade por teclado, tema claro/escuro, CSP restritiva.
- [ ] Nenhuma dependência obrigatória de VS Code instalado.

### 6.2 Contexto, privacidade e aprovação — T05

- [ ] Coletar **somente** seleção/arquivo(s) explicitamente escolhidos.
- [ ] Gerar inventário do contexto com caminhos relativos, linguagem e tamanho, sem exposição indevida.
- [ ] Aplicar exclusões `.gitignore`, `.env`, chaves privadas, certificados, tokens, arquivos sensíveis e padrões configuráveis.
- [ ] Prevenir path traversal, symlink escape e acesso fora do workspace aprovado.
- [ ] Pré-visualizar cada trecho antes do handoff; permitir remover arquivos/trechos.
- [ ] Exigir autorização específica para copiar/transferir o conteúdo; evitar inclusão automática de projeto completo.
- [ ] Não transformar conteúdo de arquivos, comentários ou respostas em instruções privilegiadas (*prompt injection*).

### 6.3 Fluxo web assistido e patch review — T06

- [ ] Preparar prompt estruturado (problema, contexto aprovado, linguagem/arquivos e instruções).
- [ ] Copiar somente texto revisado para clipboard; abrir/focar Gemini Web no **navegador legítimo e suportado**, com fallback externo.
- [ ] Interação, login e envio ao Google realizados pelo **próprio usuário**.
- [ ] Importar resposta por colagem explícita/ação consciente; nenhuma leitura programática do Gemini Web.
- [ ] Parser de patches/alterações com validação, diagnóstico e tratamento de Unicode.
- [ ] Preview de diff por arquivo, apply/reject explícito; sem escrita prévia à aprovação.
- [ ] Suportar conflitos, arquivos inexistentes, leitura/escrita fora do workspace, symlinks e reversão segura.
- [ ] Registrar operações sensíveis de forma sanitizada, sem payload confidencial.

### 6.4 Fluxo completo de aceitação de M1 / G2

1. Abrir Argonauta dentro do **Antigravity IDE real**.
2. Selecionar código, abrir comando, inspecionar prévia e exclusões.
3. Confirmar contexto que será copiado e abrir Gemini Web externamente, se necessário.
4. Enviar manualmente prompt em sessão legítima.
5. Importar resposta e visualizar diff.
6. Rejeitar/aprovar mudanças específicas; provar que antes da aprovação o workspace permanece intacto.
7. Testar `.env`, chaves, symlinks fora da raiz, workspace não confiável, patches inválidos e cancelamento.
8. Validar logs e histórico, primeira execução/disclaimer, restart e comandos.
9. Documentar versão do Antigravity, Windows, build e resultados `pass/fail/unsupported`.

**M1 está pronto apenas quando todo o fluxo for demonstrado com testes e evidência real, sem precisar da ponte IPC.**

---

## 7. M2 — Beta open source confiável (T04, T05, T06, T09)

**Estado:** `planned`.

- [ ] Consolidar UX, estados de erro, theming, alto contraste, leitores de tela, teclado e i18n (UI em inglês como meta do PRD, com estrutura para pt-BR; seguir as regras atuais de idioma do repositório e aprovar mudança de política antes de alterar strings).
- [ ] Melhorar testes unitários, integração e E2E do **produto**, além das POCs.
- [ ] Testar prompt injection, file permission gate, `.gitignore`, exclusão de segredos, path traversal, symlink, patches e rollback.
- [ ] Empacotar VSIX reproduzível e validar **no Antigravity real**.
- [ ] Política de erros/logs privados, upgrade/migração de sessões, sem telemetria padrão.
- [ ] Documentação pública em inglês e pt-BR quando aprovada, limitações do modo Web Assisted, walkthrough e exemplos seguros.
- [ ] CI com verificações do produto, build, auditoria e testes; matriz multiplataforma somente quando esses hosts forem suportados.
- [ ] GitHub prerelease/beta com release notes, segurança, canal de issues e instruções de reprodução.
- [ ] Não anunciar “agente Gemini Web autônomo” nem “acesso oficial ao Argon” sem G3/G4.

**Critério de M2:** beta Web Assisted instalável e honesta sobre capacidades, com regressões e aprovação do mantenedor, independentemente de T03/T08.

---

## 8. M3 — Official API Agent (T07)

**Estado:** `conditional`; pode evoluir como trilha paralela ao amadurecimento do núcleo M1/M2.

- [ ] POC-07: verificar disponibilidade de API **documentada e oficial**, preços, modelos e permissões reais da conta/chave.
- [ ] Adapter de provedor isolado da UI, com *capabilities* declaradas: streaming, tools, modelos, limite e status.
- [ ] BYOK: chave do usuário em `ExtensionContext.secrets`, sem `settings.json`, sem logs, sem upload automático.
- [ ] Custos e limites explícitos por operação, estimativas claramente identificadas.
- [ ] Timeout, cancelamento, retry controlado, rate limits, mensagens de erro tratadas.
- [ ] Tool orchestration com allowlist, escopo de workspace, Workspace Trust, avaliação de risco e aprovação humana.
- [ ] Revisão de comandos exatos antes de qualquer terminal/execução; nenhuma execução silenciosa.
- [ ] Diffs, backups/checkpoints, rollback, logs de decisões e proteção contra prompt injection.
- [ ] Testes de contratos, falhas, permissões e revisão humana.
- [ ] G4 aprovado **para as funcionalidades realmente demonstradas**, não por ter implementado somente chat.

**Não objetivo:** utilizar Google AI Pro como se fornecesse, automaticamente, cota de Gemini API.

---

## 9. M4 — Web Bridge (T03, T08)

**Estado:** `conditional` e de alto risco.

### Pré-condições que não podem ser omitidas

- [ ] POC-05B 0–6 concluída com testes de segurança e host real (G3-T).
- [ ] Existência de mecanismo **documentado, permitido e sustentável** para integração com a experiência web pretendida (G3-W).
- [ ] Consentimento informado e modelo de ameaças atualizado para os dados compartilhados.
- [ ] Escopo/permissões mínimos da extensão Chrome, sem coleta de sessões/cookies/tokens.
- [ ] Avaliação explícita dos termos, limitações do navegador e mudanças de plataforma.
- [ ] Plano de degradação para modo Web Assisted ao falhar integração.

### Entregas somente após aprovação dos gates

- [ ] `apps/chrome-extension/` e `apps/native-host/` apenas quando aplicações reais forem implementadas.
- [ ] Conexão Chrome persistente por `connectNative()`, com novo identificador e registro `com.argonauta.poc05b`, separado da POC-05A.
- [ ] Canal IPC local com ACL comprovada, autenticação mútua HMAC e defesa contra replay.
- [ ] Roteamento bidirecional com correlação, timeouts, cancelamento e backpressure.
- [ ] Interface de integração web baseada **exclusivamente** em mecanismo permitido e documentado, se existir.
- [ ] Testes de reinício, desconexão, versões, atualização de Chrome/Antigravity, segurança e UX.
- [ ] Limites de disponibilidade e suporte comunicados na UI e README.

**Regra de parada:** se G3-W não puder ser aprovado, declarar Web Bridge `rejected/blocked` conforme evidência, arquivar a pesquisa e continuar evoluindo M1/M2/M3. Não contornar mecanismos de controle de terceiros.

**Regra de nomenclatura:** transporte Chrome ↔ IDE não significa automaticamente “Gemini Web integration”. São entregáveis diferentes.

---

## 10. M5 — Publicação, distribuição e operação contínua (T01, T09)

**Estado:** `planned`. Primeiro release pode ser **Web Assisted**, sem exigir M3 nem M4.

- [ ] Resolver formalmente licença (MIT ou Apache-2.0 ou outra aprovada pelo mantenedor), titularidade, avisos e contribuições.
- [ ] Verificar nome, publisher, namespace, marca, ícones e texto de independência.
- [ ] Definir versionamento semântico, changelog e convenções de commits/releases.
- [ ] Proteger `main` com CI e política adequada, quando configurável pelo mantenedor.
- [ ] Habilitar canal de reporte privado de vulnerabilidades, processo de divulgação responsável e atualização de dependências.
- [ ] Produzir VSIX e reproduzir instalação no Antigravity IDE **sem VS Code obrigatório**.
- [ ] Página do projeto com demonstração honesta, tutoriais, FAQ, suporte mínimo e matriz de compatibilidade.
- [ ] Submeter ao **Open VSX Registry** quando os critérios e as políticas de publicação forem cumpridos.
- [ ] Considerar Visual Studio Marketplace **somente após teste real no VS Code** e revisão de requisitos, sem bloquear Open VSX.
- [ ] Definir política de manutenção, compatibilidade, suporte, versões mínimas, regressão e encerramento de integrações condicionais.

**Critério de G5:** release auditável, licenciado, instalável e testado no ambiente anunciado; sem publicidade de funcionalidades não comprovadas.

---

## 11. Rastreabilidade dos requisitos funcionais do PRD

**Não remover nem alterar um requisito funcional sem decisão explícita e registro de impacto.** O PRD permanece a fonte para especificação detalhada.

| Requisito PRD | Entregável mestre | Trilha / Marco |
|---|---|---|
| FR-01 — `Argonauta: Open` / painel | Shell e navegação | T04 / M1 |
| FR-02 — navegador web suportado | Abertura/fallback externo | T02 + T06 / M1 |
| FR-03 — Ask About Selection | Comando e prompt | T04 + T05 / M1 |
| FR-04 — escolha do contexto | ContextCollector / preview | T05 / M1 |
| FR-05 — cópia de prompt | Handoff aprovado | T06 / M1 |
| FR-06 — importar resposta/patch | Importador validado | T06 / M1 |
| FR-07 — diff apply/reject | Revisão e edição segura | T06 / M1 |
| FR-08 — histórico local | SessionStore e limpeza | T04 / M1 |
| FR-08b — First-run Disclaimer | Termo de ciência e aceite | T04 / M1 |
| FR-09 — estados de provider | Capabilities/status na UI | T04 / M1 |
| FR-10 — cancelamento/logs | Observabilidade sanitizada | T04 + T09 / M1–M2 |
| FR-11 — tema/acessibilidade | UI acessível | T04 + T09 / M1–M2 |
| FR-12 — provedor API | API oficial / BYOK | T07 / M3 |
| FR-13 — ferramentas estruturadas | Orquestrador e permission gates | T07 / M3 |
| FR-14 — terminal autorizado | Confirmação de comando exato | T07 / M3 |
| FR-15 — múltiplos arquivos/checkpoints | Segurança/rollback | T06 + T07 / M2–M3 |
| FR-16 — indexação seletiva | Exclusões/contexto seguro | T05 / M2–M3 |
| FR-17 — mensagens web bidirecionais | Web Bridge permitido | T08 / M4 |
| FR-18 — agent loop web | Somente G3+G4 | T08 / M4, condicional |
| FR-19 — backends BYOK adicionais | Arquitetura de providers | T07 / M3+, condicional |

**Ponto de controle:** marcar um requisito como entregue somente quando seu próprio critério de aceite do `PRD.md` for validado, não apenas porque existe arquivo/classe com aquele nome.

---

## 12. Arquitetura corrente e arquitetura evolutiva

### 12.1 O que existe no `main` público de referência

```text
argonauta/
├── .agents/                         # Regras e skills do agente
├── .github/workflows/validation.yml # CI Windows
├── docs/
│   ├── architecture/
│   │   ├── decisions/0001-monorepo-architecture.md
│   │   ├── bridge-design.md
│   │   └── overview.md
│   ├── development/
│   ├── security/threat-model.md
│   └── validation/
│       ├── POC-05A.md
│       ├── POC-05B-ETAPA-0.md
│       ├── POC-05B-ETAPA-1.md
│       ├── monorepo-migration.md
│       └── manual-tests/
├── packages/protocol/
├── tools/compatibility-probe/
├── tools/native-messaging-smoke/
├── tests/integration/
├── scripts/verify-fixtures.mjs
├── package.json
├── package-lock.json
└── tsconfig.base.json
```

`apps/` e `packages/ipc/` **ainda não existiam no HEAD público consultado**. O agente pode ter código local ainda não enviado; conferir antes de assumir ausência global.

### 12.2 Direção futura de dependências

```text
apps/ide-extension  ----> packages/protocol
         |                    ^
         |                    |
         +----> packages/ipc -+     (quando seguro e implementado)
         |
         +----> packages/<módulo-do-produto> (somente conforme necessidade)

apps/chrome-extension  ----> protocolo compatível com runtime Chrome
apps/native-host       ----> packages/protocol + packages/ipc

tools/*                ----> ferramentas/probes isolados, não apps finais
tests/integration      ----> cenários entre pacotes e aplicações
```

A API TypeScript pública de `@argonauta/protocol` já depende do Node.js (`Buffer`, `node:util`). **Não assumir importação direta no Chrome service worker**; estudar adapter/contrato de serialização compatível sem violar fixtures.

`packages/ipc` não deve ser criado como fachada insegura enquanto o gate de DACL/remote estiver bloqueado.

### 12.3 Nomenclatura e manutenção

- Workspaces técnicos e diretórios: nomes profissionais, estáveis e orientados à responsabilidade, em inglês/kebab-case.
- Campos wire já congelados: preservados, mesmo que estejam em português (`idRequisicao`, `versaoProtocolo`).
- Documentos e textos: seguir `AGENTS.md` e `.agents/rules/language.md`; qualquer alteração de política linguística do produto precisa ser explícita.
- Evitar refatoração estética repetitiva; mover arquivos somente com razão técnica e plano de testes.
- Não introduzir monorepo framework, binários nativos, servidores de rede ou novos privilégios sem justificativa e autorização.

---

## 13. Critérios de qualidade e riscos transversais

### 13.1 Qualidade para cada entrega

- Build e TypeScript `strict` sem erro nos workspaces afetados.
- Testes unitários + integração para mudanças funcionais; incluir regressões anteriores.
- Fixtures e versionamento de contrato preservados; breaking change só com aprovação/versionamento.
- CI Windows verde quando código for publicado; testes manuais reais onde necessários.
- Casos negativos: falhas de conexão, cancelamento, entradas maliciosas, limites de memória, Unicode e atualização/reinício.
- Documentação de API pública, README e runbook correspondente atualizados.
- Revisão de privacidade, segurança, desempenho e teardown.
- Relatório final separando evidências, limitações e riscos residuais.

### 13.2 Registro dos riscos que não podem desaparecer

| Risco | Estado/impacto | Plano de resposta |
|---|---|---|
| **G3-W: Gemini Web não possuir mecanismo permitido** | Alto risco de inviabilizar M4 | Pesquisa de APIs/termos; se não houver, encerrar M4 e seguir M1/M3. |
| **Named Pipe `node:net` com ACL/remote insuficiente** | Bloqueio de POC-05B Etapa 2 relatado | Auditar ADR-0002/testes; propor alternativa Win32 mínima apenas após aprovação. |
| **M1 ser indevidamente bloqueado pelo transporte** | Risco de cronograma/produto | Manter trilha M1 independente da POC-05B. |
| **Vazamento de contexto/credenciais** | Crítico | Preview, denylist, allowlist, Workspace Trust e testes de caminho/log. |
| **Aplicação insegura de patch** | Crítico | Parser, diff, autorização por arquivo e rollback. |
| **Prompt injection via arquivos/resposta** | Alto | Isolar dados de instruções; permission gates e testes. |
| **Host/Chrome mudarem versões e lifecycle** | Médio/alto | Matriz, smoke tests, degradação explícita. |
| **Confusão entre POC e produto** | Alto | `tools/` para provas, `apps/` apenas para produtos reais. |
| **Licença/namespace pendentes** | Bloqueio de release | Decidir antes de distribuição; não escolher automaticamente. |
| **Afirmações públicas além da evidência** | Risco reputacional | README/UI/roadmap coerentes com gates e testes observados. |

---

## 14. Próximas decisões priorizadas (não confundir decisão com implementação)

### D01 — Revisar o bloqueio de IPC (T03 / M0)

**Próxima ação técnica da ponte:** obter `ADR-0002`, `docs/validation/ipc-transport.md`, script e evidências locais; validar o cenário de DACL/remote e apresentar ao mantenedor uma recomendação sobre helper Win32 com descritor explícito. **Não implementar alternativa automaticamente.**

**Saída:** `accepted / blocked / rejected`, registro de ameaça, prova do Windows e autorização explícita do próximo escopo.

### D02 — Abrir o backlog M1 Web Assisted em paralelo (T04–T06)

Definir o primeiro incremento pequeno da **extensão real** do Antigravity: comando, painel e detecção de capacidades; depois contexto seguro; depois handoff e patch review. Não incorporar Chrome bridge antes da hora.

**Saída:** plano de implementação por incrementos, testes de aceitação e UX mínima, mantendo o PRD como contrato.

### D03 — Encerrar evidência de G1 para o caminho externo (T02)

Registrar uma interação normal e bem-sucedida no Gemini Web via Chrome com sessão legítima, sem leitura programática da página; distinguir da POC-05A PONG. Se já houver evidência no computador do mantenedor, documentá-la sanitizada sem repetir desnecessariamente.

**Saída:** G1 aprovado para o fallback externo, ou `pending_validation/blocked` com justificativa.

### D04 — Fixar governança do roadmap (T01)

Aprovar esta estrutura (M0–M5 + T01–T09 + POCs + Gates), decidir licença/publicação em marcos apropriados e alinhar `memory.md` ao estado novo, especialmente ao **bloqueio relatado** na Etapa 2.

**Saída:** nova versão canônica no repositório, com histórico e fonte de evidências.

**Ordem recomendada:** D01 e D02 podem prosseguir **em paralelo**, pois a arquitetura Web Assisted não depende da decisão Win32.

---

## 15. Política de atualização: como impedir deriva do roadmap

**Este capítulo é parte obrigatória do documento, não uma recomendação opcional para futuras conversas.**

1. **Não renumerar M0–M5, T01–T09, G0–G5, FR-xx ou etapas da POC-05B.** Identificadores são estáveis; trabalho adicional entra em subtarefas ou novas trilhas somente após decisão formal.
2. **Não apagar a história:** em cada atualização, alterar estado, evidência e data; manter referências para ADRs, relatórios e commits. Retirar uma tarefa exige registro de decisão, não desaparecimento.
3. **Não alterar visão/proposta de valor silenciosamente:** mudança de produto exige discussão, impacto no PRD e aprovação.
4. **Não usar `done` sem prova reproduzível:** o agente relata, o mantenedor valida interações manuais, o revisor confere o código conforme disponível.
5. **Não transformar `blocked` em `pass` porque surgiu uma hipótese técnica:** exigir reprodução, teste negativo e gate de segurança específico.
6. **Não juntar marcos condicionais ao caminho crítico do MVP:** G3-T/G3-W não bloqueiam M1.
7. **Não chamar tudo de uma única “Etapa 2”:** explicitar sempre `M2`, `POC-05B Etapa 2` ou `T02`, para não misturar níveis.
8. **Manter sincronização:** `PRD.md` descreve requisitos; roadmap descreve dependências/status; `HISTORY.md` recebe acontecimentos; ADR recebe decisão; `docs/validation` recebe provas; `memory.md` é resumo transferível.
9. **Git controlado:** agente não faz commit, push, merge ou altera chaves do Registro sem autorização explícita.
10. **Revisão do status por fonte:** a atualização deve informar branch, commit, data, resultados CI, testes manuais e documentos ainda não publicados.

### Registro de mudanças do ROADMAP

| Versão / data | Alteração | Evidência / decisão | Situação |
|---|---|---|---|
| Histórico até 14/10/2026 | ROADMAP anterior com M0–M5 e etapas POC-05B; monorepo, testes e CI aprovados. | Histórico do repositório e documentação. | Preservado como baseline. |
| **2.0.0 — proposta, 14/10/2026** | Consolidação de M0–M5 com nove trilhas T01–T09, gates separados e caminho MVP independente de IPC. | PRD, planejamento POC-05B, ROADMAP anexado, observações da revisão. | **Proposta; ainda não integrada ao GitHub.** |
| Pendente | Auditoria do gate `node:net` e eventual decisão de helper Win32. | ADR-0002/relatório citados pelo anexo, ainda não auditados no `main` verificado. | `pending_validation`. |

---

## 16. Referências canônicas e comando de retomada

**Documentos principais:**
- [PRD.md](PRD.md) — requisitos e Definition of Done.
- [AGENTS.md](AGENTS.md) e [.agents/rules/](.agents/rules/) — políticas para o agente.
- [README.md](README.md) — comunicação pública do estado do produto.
- [HISTORY.md](HISTORY.md) — histórico factual.
- [SECURITY.md](SECURITY.md) e [docs/security/threat-model.md](docs/security/threat-model.md).
- [docs/architecture/overview.md](docs/architecture/overview.md).
- [ADR-0001](docs/architecture/decisions/0001-monorepo-architecture.md) — monorepo.
- [docs/architecture/bridge-design.md](docs/architecture/bridge-design.md) — plano técnico da POC-05B.
- [docs/validation/POC-05A.md](docs/validation/POC-05A.md).
- [docs/validation/POC-05B-ETAPA-0.md](docs/validation/POC-05B-ETAPA-0.md).
- [docs/validation/POC-05B-ETAPA-1.md](docs/validation/POC-05B-ETAPA-1.md).
- [docs/validation/monorepo-migration.md](docs/validation/monorepo-migration.md).
- [docs/validation/manual-tests/](docs/validation/manual-tests/).
- [docs/validation/compatibility-matrix.md](docs/validation/compatibility-matrix.md).
- **Referências relatadas no anexo ainda não verificadas no HEAD público:** `docs/architecture/decisions/0002-node-net-security-gate.md`, `docs/validation/ipc-transport.md`.

**Comandos usuais de validação do snapshot público:**

```powershell
npm ci
npm run compilar
npm run typecheck
npm test
npm run verificar:fixtures
npm audit --audit-level=high
git diff --check
git status
```

Consultar sempre `package.json` atual antes de executar novos scripts. O comando `npm run verificar:ipc-security-gate` foi **relatado no anexo**, mas não confirmado no snapshot público citado; só usá-lo quando existir no checkout local.

### Instrução pronta para a próxima conversa/agente

> Trate `ROADMAP.md` como a bússola estável do Argonauta e `PRD.md` como contrato funcional. Preserve M0–M5, T01–T09, G0–G5 e a POC-05B 0–6 como níveis separados. Consulte o último commit e as evidências atuais; não suponha que a versão do arquivo corresponda ao estado local. O projeto é desenvolvido exclusivamente no Antigravity IDE, em Windows. A POC-05A e as etapas 0/1 da POC-05B foram aprovadas; a Etapa 2 foi relatada como bloqueada por segurança no `node:net`, aguardando auditoria do ADR e decisão. O MVP Web Assisted não depende dessa ponte. Não implemente Gemini Web por APIs privadas, cookies ou bypass, não afirme G3 aprovado por ter IPC, e não faça commit/push ou mudanças no Registro sem aprovação explícita. Reavalie os gates e registre decisões sem reescrever o roadmap inteiro.

**Fim do ROADMAP mestre proposto.**
