# Argonauta — Documento de Requisitos do Produto (PRD)

> **Produto:** Argonauta — extensão open source de assistência e agência de programação, desenvolvida e validada primeiro no Google Antigravity IDE.  
> **Visão do produto:** uma experiência de agente de programação integrada à IDE, com painel próprio, contexto de projeto, conversação, planejamento, ferramentas, alterações revisáveis e provedores intercambiáveis.  
> **Motivação original prioritária:** investigar a utilização **permitida, estável e verificável** da experiência Gemini Web — incluindo o acesso ao modelo identificado pelo mantenedor como **Gemini 4 Argon** em sua assinatura **Google AI Pro** — como possível mecanismo de inferência para o agente.  
> **Versão do documento:** 0.2.0 — revisão de alinhamento de produto proposta para aprovação do mantenedor.  
> **Data-base:** 14 de outubro de 2026.  
> **Referência técnica consultada:** `main`, commit `01a86b6ca6f22d98babb61743af590a8612389f6`.  
> **Estado:** fundação e experimentos iniciais validados; transporte IPC POC-05B bloqueado; **integração Gemini Web agêntica não validada**; extensão final e MVP de produto ainda não implementados.  
> **Idioma:** conteúdo e requisitos atuais em português brasileiro, conforme `AGENTS.md` e `.agents/rules/language.md`; internacionalização futura depende de decisão explícita.

## 0. Norte do produto e regras de interpretação

**Argonauta não é, em sua visão final, apenas um copiador de prompts, uma interface de chat isolada, um cliente de API ou uma ponte IPC.** É uma extensão agêntica de programação, destinada a oferecer uma experiência de trabalho comparável, em categoria de produto, à de Codex, Claude Code e Kilo Code, sem reproduzir identidade, código, design proprietário ou prometer paridade funcional não demonstrada.

A interação desejada é direta: o desenvolvedor abre o **ícone do Argonauta na barra de atividades lateral da IDE**, conversa no painel, compartilha contexto de forma controlada, solicita análise ou execução, acompanha o plano e as etapas, revisa as alterações e autoriza operações sensíveis. A experiência deve existir dentro do Antigravity IDE, não depender de o usuário programar no aplicativo VS Code.

A **hipótese de produto que originou o Argonauta** é aproveitar, quando legitimamente possível, a experiência do Gemini Web disponibilizada pela assinatura Google AI Pro do próprio usuário, inclusive o modelo Gemini 4 Argon conforme observado naquela interface. O fato de um modelo aparecer no navegador **não comprova** acesso por API, permissão para automação, uso ilimitado, estabilidade de disponibilidade ou viabilidade de tool calling bidirecional.

O Argonauta deverá diferenciar permanentemente:

1. **Visão final:** agente de programação completo e centrado na IDE, independente do provedor.
2. **Motivação e hipótese prioritária:** viabilizar a experiência com Gemini Web/Argon, focando o desenvolvimento na solidez técnica e segurança da ferramenta, sem impor limites no desenvolvimento por restrições contratuais externas, cabendo ao usuário a ciência e responsabilidade pelos riscos.
3. **Primeira entrega funcional:** Extensão real em `apps/ide-extension/` com núcleo agêntico, ícone na Activity Bar, painel integrado, ferramentas autorizadas, revisão de edições e pacote `.vsix` instalável pela interface da IDE. A conexão com modelos é uma dependência explícita (com fallback manual no modo Web Assistido quando não houver provedor direto conectado), sem promessas não comprovadas de automação.
4. **Alternativa programática:** agente por API oficial, com chave, condições de acesso e custos próprios, sem presumir direitos derivados do Google AI Pro.
5. **Infraestrutura de pesquisa:** POCs, Named Pipes, Chrome Native Messaging e contratos. São meios técnicos, não substitutos das capacidades do produto.

**Regra de priorização:** uma tarefa de infraestrutura deve declarar que capacidade ou gate de produto atende, por que é necessária agora, como será validada e por que não pode esperar. O bloqueio de uma POC opcional não interrompe automaticamente o progresso do MVP e do núcleo da extensão.

Este documento define **o que** o produto deve entregar. `ROADMAP.md` define marcos, ordem e estados; ADRs registram decisões arquiteturais; `docs/validation/` guarda evidências; `HISTORY.md` registra acontecimentos. Um requisito planejado neste PRD não é funcionalidade implementada.

## 1. Resumo executivo

O **Argonauta** é uma extensão independente e open source para programação assistida e agêntica no **Google Antigravity IDE**, com compatibilidade futura — a ser comprovada — com VS Code e outros hosts que disponibilizem APIs adequadas.

A oportunidade surgiu da diferença observada em 14/10/2026 entre o modelo **Gemini 4 Argon** disponível na experiência **Gemini Web** do mantenedor com **Google AI Pro** e as opções apresentadas nos recursos de agente do Antigravity IDE/CLI para aquela assinatura. Trata-se de observação pontual, sujeita a mudanças e não generalizável para outras contas.

**Objetivo de experiência:** permitir conversação contextual com código, planejamento de tarefas, consulta e modificação controlada de arquivos, execução autorizada de ferramentas/testes, histórico, acompanhamento da atividade, diffs, checkpoints e respostas do provedor — com nível real de automação dependente das capacidades comprovadas de cada integração.

**Objetivo distintivo de pesquisa:** descobrir se existe mecanismo público, documentado, tecnicamente estável e permitido para utilizar a experiência Gemini Web/Argon como provedor bidirecional de uma extensão agêntica. **Não há aprovação desse mecanismo.** Uma ponte funcional entre IDE e Chrome, isoladamente, não demonstra acesso agêntico ao Gemini Web.

Caso a hipótese de integração não seja viável ou permitida, o projeto deverá continuar útil com **Web Assistido** e, se implementado, **agente por API oficial**. Essa contingência preserva o produto open source; **não redefine retroativamente a hipótese original como alcançada**.

O desenvolvimento, depuração e a validação inicial do mantenedor ocorrem no Antigravity IDE, em Windows. O uso de bibliotecas de tipos e interfaces de extensão compatíveis com VS Code não exige a instalação nem a utilização do aplicativo VS Code.

## 2. Problema, oportunidade e posicionamento

### 2.1 Problemas

- Um usuário pode visualizar determinado modelo no Gemini Web e não dispor dele nos agentes integrados da IDE, de acordo com a conta, plano, disponibilidade e políticas vigentes.
- A troca manual entre navegador e editor dificulta manter contexto, acompanhar decisões, revisar alterações e retomar tarefas.
- Um agente que lê e escreve no workspace cria riscos de vazamento, execução indevida, prompt injection e modificações não autorizadas.
- Integrações que simulam APIs usando cookies, endpoints privados ou automação não autorizada são frágeis e potencialmente incompatíveis com os termos do provedor.
- Infraestrutura técnica pode avançar sem criar valor observável ao desenvolvedor, se a experiência de produto e seus gates não forem priorizados.

### 2.2 Oportunidade

Construir uma experiência **IDE-first**, com identidade visual própria e arquitetura de capacidades reais, que comece útil de forma assistida, evolua para um agente programático quando autorizado e investigue o caminho Gemini Web sem atalhos inseguros.

### 2.3 Proposta de valor

**Para o desenvolvedor:** uma área de trabalho agêntica dentro da IDE para perguntar, planejar, analisar o projeto, revisar diffs e autorizar ações, com contexto explícito e escolha transparente de provedor.

**Para quem tem Google AI Pro:** uma pesquisa orientada a viabilizar o uso legítimo da experiência Gemini Web/Argon na IDE, sem prometer que a assinatura corresponda a créditos de API ou a um backend automatizado.

**Para a comunidade:** software open source auditável, com decisões, limitações, testes e registros de segurança verificáveis.

### 2.4 Nome, marca e identidade

- Nome de trabalho: **Argonauta**; slug proposto: `argonauta`.
- Slogan proposto: *Navigate beyond the limits.*
- Ícone próprio e reconhecível na barra lateral da IDE, com apresentação consistente no painel e no pacote da extensão.
- Não usar logos nem elementos que induzam confusão com produtos oficiais do Google, Microsoft, Anthropic ou OpenAI.
- Confirmar publisher, namespace, licença e eventuais conflitos de marca antes de publicar.
- Compatibilidade e capacidades devem ser comunicadas apenas após testes reais.

## 3. Público-alvo e jornadas

| Perfil | Necessidade | Prioridade |
|---|---|---|
| Desenvolvedor com Google AI Pro e Gemini 4 Argon disponível no Gemini Web | Investigar uso integrado legítimo dessa experiência para trabalhar com código | Origem do produto / pesquisa prioritária |
| Desenvolvedor que utiliza Antigravity IDE | Painel e ferramentas de agente no ambiente principal | P0 de plataforma |
| Desenvolvedor que deseja assistência manual segura | Transferir contexto e respostas com prévia e diff | P0 da primeira entrega |
| Usuário com acesso a API oficial | Obter comunicação e ferramentas programáticas por backend documentado | Caminho de agente condicionado |
| Usuário de VS Code e hosts compatíveis | Experiência equivalente após homologação | Posterior |
| Colaborador open source | Entender contratos, segurança e contribuir com implementações isoladas | Contínuo |

**Jornadas desejadas:**

1. **Perguntar:** abrir o Argonauta pela barra lateral, escolher contexto, fazer uma pergunta e acompanhar uma resposta do provedor configurado, conforme suas capacidades reais.
2. **Planejar:** pedir uma solução para um problema, receber etapas e analisar arquivos relevantes antes de aprovar qualquer alteração.
3. **Agir:** após habilitação de backend apropriado e gates, autorizar o agente a editar arquivos, executar testes e relatar resultados, com acompanhamento de etapas e opção de interromper.
4. **Revisar:** inspecionar mudanças por arquivo, aprovar/rejeitar, comparar com conteúdo anterior e recuperar alterações quando tecnicamente possível.
5. **Gemini Web:** usar a sessão normal do navegador para o fluxo manual; integração bidirecional somente se existir mecanismo comprovadamente permitido.

## 4. Objetivos e métricas

### 4.1 Objetivos

A revisão preserva os objetivos originais **O1–O4** e acrescenta os objetivos **O5–O7** que tornam a visão agêntica e o Gate G3-W mais explícitos.

- **O1 — Viabilidade técnica do fluxo web:** investigar a utilização do Gemini Web e do Argon em navegador integrado do Antigravity e documentar fallback externo quando necessário. A incompatibilidade observada no Jetski deve permanecer como evidência, sem diagnóstico causal inventado.
- **O2 — UX mínima útil:** selecionar contexto no editor, montar prompt, acessar Gemini Web pela sessão legítima, copiar/importar uma resposta e revisar/aplicar patch com segurança.
- **O3 — Evolução controlada:** adicionar backend programático **oficial** e provedores intercambiáveis sem reescrever a UI e o orquestrador.
- **O4 — Credibilidade:** entregar extensão auditável, matriz de compatibilidade real, documentação e demonstrações reproduzíveis.
- **O5 — Experiência agêntica como produto final:** construir ícone lateral, painel, chat contextual, planejamento, ferramentas, diffs, histórico e ciclo de tarefas conforme capacidades realmente implementadas.
- **O6 — Investigação Gemini Web/Argon:** viabilizar tecnicamente o uso bidirecional da experiência Gemini Web/Argon sem impor limites no desenvolvimento por regras contratuais de terceiros, assegurando que o usuário final esteja plenamente ciente dos riscos e assuma o uso por sua conta e responsabilidade.
- **O7 — Governança de prioridades:** relacionar infraestrutura a requisitos e gates, preservando o avanço de M1 independentemente do bloqueio da POC-05B.

### 4.2 Metas de validação (não são resultados observados)

| Métrica | Meta | Evidência |
|---|---|---|
| Ícone lateral | Ícone do Argonauta acessível na Activity Bar; view abre e restaura | Teste manual no Antigravity real |
| Interface | Painel de conversa/contexto/atividade navegável por teclado e responsivo | Testes de UI e usabilidade |
| Handoff de contexto | Somente dados visualizados e aprovados saem para clipboard/provedor | Testes negativos e manuais |
| Fluxo seleção → prompt | Concluir em até três ações deliberadas, quando razoável | Roteiro de usabilidade |
| Aplicação de patch no MVP | 100% das escritas precedidas por prévia e autorização específica | Testes e logs sanitizados |
| Logs | Nenhum segredo, cookie ou dado sensível exposto | Testes de segurança |
| Agente programático | Tool calling, cancelamento, limites e aprovações comprovados no provedor de teste | E2E real, posterior |
| Gemini Web/Argon agêntico | Gate técnico **e** gate de permissão aprovados | POC e revisão de termos documentadas; atualmente não comprovado |
| Qualidade de entrega | Build, typecheck, testes, empacotamento e CI válidos | Pipeline + teste manual do host |
| Compatibilidade | Declarar apenas SO/IDE/versões testados | Matriz de suporte |

### 4.3 Não objetivos e restrições

- Converter Google AI Pro em créditos de API, acesso ilimitado ou mudança de nível de assinatura.
- Usar cookies, tokens, perfis de navegador, endpoints privados, engenharia reversa de sessões ou automação não autorizada.
- Ignorar CAPTCHA, paywalls, controles antiabuso, CSP ou políticas do serviço.
- Anunciar agent loop web, streaming, leitura da página ou tool calling sem comprovação.
- Executar comandos arbitrários ou editar arquivos sem o controle de permissões apropriado.
- Exfiltrar automaticamente o workspace, armazenar segredos em logs ou coletar telemetria por padrão.
- Copiar design, marca ou propriedade intelectual de outros agentes.
- Priorizar indefinidamente uma infraestrutura bloqueada em detrimento da primeira experiência de produto.

## 5. Princípios e responsabilidades

1. **Agente como norte:** o produto completo é uma experiência agêntica; o modo manual é uma etapa intermediária explicitamente identificada.
2. **Verdade sobre capacidades:** cada provedor declara o que realmente suporta; nenhum comportamento é simulado para aparentar autonomia.
3. **Consentimento granular:** contexto, cópia/envio, escrita, terminal e operações externas sensíveis requerem os controles e aprovações definidos para a respectiva capacidade.
4. **Segredos protegidos:** não solicitar credenciais, cookies ou tokens de login de terceiros. Chaves de API próprias, quando aplicáveis, ficam em armazenamento seguro do host.
5. **Segurança técnica sem limites artificiais de desenvolvimento:** o projeto prioriza a solidez técnica, a privacidade e a segurança estrita do software e do ambiente do desenvolvedor, sem impor barreiras de engenharia baseadas em limites contratuais de serviços terceiros. A responsabilidade quanto aos termos e políticas de plataformas externas é do usuário, devidamente orientado e ciente dos riscos.
6. **Local-first:** contexto, filtros, parsing e diffs ocorrem localmente; nada sai do workspace automaticamente.
7. **Mínimo privilégio:** Workspace Trust, validação de caminhos, symlinks, exclusões, timeouts, limites e falha fechada.
8. **Independência de provedor:** UI, sessão, ferramentas e orquestrador não importam interfaces privadas do Gemini Web.
9. **Degradação honesta:** falhas de um provedor não são mascaradas por outro modo sem informar e obter concordância.
10. **Engenharia reproduzível:** TypeScript estrito, workspaces, testes, CI, ADRs, evidências e segurança são parte do produto.
11. **Desenvolvimento Antigravity-first:** todas as capacidades do host devem ser exercitadas e validadas no Antigravity real antes de divulgação.
12. **Governança:** agente implementador não faz commit, push, merge, instalações sensíveis ou alterações no Registro sem autorização expressa do mantenedor.

### 5.1 Isenção de responsabilidade e ciência de riscos (AS IS)

O Argonauta é software independente e open source, fornecido **no estado em que se encontra (AS IS)**, sem promessa de disponibilidade contínua, adequação a um propósito ou ausência de falhas.

**Princípio de não limitação no desenvolvimento e ciência do usuário:** O projeto Argonauta não impõe travas de engenharia ou limites artificiais no desenvolvimento fundamentados em restrições contratuais de serviços terceiros. Toda a proteção de segurança concentra-se na integridade do ambiente do usuário, no controle de arquivos locais e na prevenção de vazamentos. O usuário deve estar ciente de que o uso perante provedores externos é realizado por sua exclusiva conta e risco (*at your own risk*), assumindo integralmente a responsabilidade pelo cumprimento de termos e eventuais consequências em suas contas ou assinaturas.

O usuário deve conhecer e cumprir os termos de serviços terceiros que utilizar, inclusive condições de acesso, automação, APIs, contas e assinaturas. Os mantenedores não garantem que operações perante terceiros estejam imunes a restrições, bloqueios ou sanções. O usuário é responsável por revisar o conteúdo compartilhado, as alterações propostas e as ações que autorizar. O produto deve apresentar avisos e termos claros de ciência de riscos, inclusive no primeiro uso.

## 6. Hipóteses, evidências e estados atuais

A identificação e a semântica de **H-01 a H-09** são preservadas do PRD anterior. Novos itens H-10 a H-15 registram evidências que surgiram depois, sem renumerar hipóteses existentes.

| Hipótese / gate | Estado em 14/10/2026 | Evidência / próxima decisão |
|---|---|---|
| **H-01** — Conta Google AI Pro vê Argon no Gemini Web | **Observado** pelo mantenedor | Capturas e relato; não generalizar para outras contas |
| **H-02** — VS Code dispõe de navegador integrado | Documentado para VS Code; não significa suporte no Antigravity | Portabilidade futura; não é requisito de desenvolvimento |
| **H-03** — Gemini Web aceita login no navegador integrado Antigravity | **Não validado** | Jetski apresentou página em branco; não assumir a causa |
| **H-04** — Argon está disponível após login no navegador integrado | **Não validado** | POC-03 no ambiente efetivo; não equiparar seletor externo ao integrado |
| **H-05** — Antigravity contém navegador equivalente ao do VS Code | **Não comprovado como equivalência** | Jetski observado; compatibilidade e comportamento próprios |
| **H-06** — Extensões podem controlar/observar aba de terceiros por mecanismo suportado e autorizado | **Não comprovado** | POC-05 + análise de APIs e termos |
| **H-07** — Agente autônomo sobre Gemini Web por integração permitida | **Alto risco / não comprovado** | Exige G3-T, G3-W e G4; sem bypass |
| **H-08** — Gemini API pode sustentar modo agente próprio | **Viável em princípio, condicional** | POC-07, acesso e faturamento próprios; não atribuir à assinatura Pro |
| **H-09** — Open VSX e VS Marketplace aceitarão a extensão | **Não garantido** | Licença, políticas, distribuição e homologação de host |
| **H-10** — Antigravity suporta APIs públicas básicas para uma extensão | **Aprovado para o probe**, não para o produto completo | Etapa 0: 9/9 verificações manuais |
| **H-11** — Chrome Native Messaging básico funciona | **Aprovado na POC-05A** | PING/PONG no Chrome real, sem integração Gemini |
| **H-12** — Contratos e framing da ponte são robustos | **Aprovados na Etapa 1** | Testes/fixtures; não validam transporte seguro |
| **H-13** — Transporte por `node:net` atende ao gate IPC | **Reprovado / `blocked`** | DACL com `Everyone`/`Anonymous` e acesso por `\\localhost\pipe`; ADR-0002 |
| **H-14** — Helper Win32 pode atender ao gate | **`proposed` e `blocked` para execução** | ADR-0003; toolchain ausente; nenhum helper compilado |
| **H-15** — Navegador externo atende ao handoff completo do MVP | **`pending_validation` para o fluxo M1** | Conversa manual e retorno ao diff devem ser comprovados; PONG do Chrome não é prova |

**Interpretação:** prova de infraestrutura não é prova de acesso web. Falha de IPC não invalida o MVP. O núcleo agêntico pode evoluir por interfaces próprias mesmo que a hipótese Gemini Web seja inviabilizada.

## 7. Experimentos e validação da hipótese central

Os identificadores existentes são preservados. Históricos completos e provas ficam no roadmap e nos relatórios correspondentes.

- **POC-01 — Compatibilidade/host:** inventário do Antigravity e navegador integrado; recursos testados, não presumidos.
- **POC-02 — Gemini Web no Jetski:** comportamento de página em branco observado, sem diagnóstico definitivo; sem bypass.
- **POC-03 — Disponibilidade do Argon:** observar o modelo e uma conversa pela interface autorizada, com data, versão e relato sanitizado; não extrapolar observação do seletor para backend de agente.
- **POC-04 — VS Code:** portabilidade futura/voluntária, não requisito para desenvolvimento no Antigravity.
- **POC-05/05A/05B — Fronteira IDE ↔ Chrome:** investigar e validar Native Messaging, protocolo, segurança de transporte, autenticação e E2E separadamente. POC-05A e Etapas 0/1 da 05B passaram; Etapa 2 permanece bloqueada.
- **POC-06 — MVP Web Assistido:** contexto aprovado → prompt revisado → uso normal do navegador → importação explícita de resposta → diff → autorização de aplicação.
- **POC-07 — Provedor via API oficial:** teste de streaming, erros, cancelamento, custos, tool calling e proteção de credenciais, quando aplicável.

### 7.1 Pesquisa G3-W — viabilidade técnica de interação web

Antes de investir em uma ponte final como backend para o Gemini Web, a pesquisa precisa responder:

1. Existe mecanismo ou interface que permita a uma extensão trocar mensagens ou solicitações com a experiência Gemini Web de forma tecnicamente estável?
2. Esse mecanismo pode ser utilizado com a **assinatura Google AI Pro** e com o modelo observado, sem presumir créditos de API nem privilégios extras?
3. O usuário é devidamente orientado sobre a mecânica de operação e está ciente dos riscos perante as políticas de uso do serviço externo?
4. É possível obter respostas e executar ciclos de tarefas por um contrato explícito, sem leitura de sessão, interceptação de credenciais ou vazamento de dados locais?
5. Quais limites, mudanças de disponibilidade, controles de consentimento e modos de falha impactam confiabilidade e distribuição?

**Saída da pesquisa:** decisão `pass`, `blocked`, `unsupported` ou `rejected` justificada com testes empíricos, estabilidade no ambiente real e validação de segurança local. A engenharia foca na viabilidade técnica e na segurança do software; não se auto-impõem limites no desenvolvimento decorrentes de termos de terceiros, cabendo ao usuário a decisão consciente e a assunção dos riscos associados (*at your own risk*).

### 7.2 Formato de evidência

Cada experimento deve registrar `ID`, objetivo, data, commit, SO, versão do host, pré-condições, passos, resultados esperado/observado, dados sanitizados, limites, responsável pela execução e decisão. Diferenciar sempre relatório do agente, teste manual, verificação independente e CI.

## 8. Gates e dependências

| Gate | O que aprova | Estado atual / restrição |
|---|---|---|
| **G0 — Discovery** | Base e hipóteses identificadas | Fundação parcialmente comprovada; discovery contínuo |
| **G1 — Fluxo Web Utilizável** | Navegador normal e handoff efetivamente utilizáveis | Pode empregar navegador externo; exige prova do fluxo completo |
| **G2 — MVP Manual Útil** | POC-06, contexto, consentimento, importação e diff | `planned`; não depende de G3 |
| **G3-T — Ponte técnica** | IPC seguro, autenticação e E2E IDE ↔ host ↔ Chrome | **Bloqueado na POC-05B Etapa 2** |
| **G3-W — Viabilidade técnica web** | Mecanismo web funcional, tecnicamente viável e estável, com usuário ciente dos riscos | **Não validado** |
| **G4 — Agente autônomo** | Backend real (API oficial **ou** G3-T + G3-W), ferramentas, permissões, segurança, rollback | Condicional; G3 não é requisito da rota API |
| **G5 — Publicação** | Testes reais, segurança, licença, governança e requisitos de marketplace | Planejado |

**G3 = G3-T e G3-W para qualquer alegação de Web Bridge Gemini.** Um canal Node.js/Chrome funcional valida o transporte técnico (G3-T); G3-W valida a viabilidade técnica de interação com a interface web. A responsabilidade quanto aos termos e políticas de serviços terceiros é do usuário final devidamente conscientizado. Um backend API oficial pode permitir G4 sem G3, sob condições de credencial e faturamento independentes.

## 9. Requisitos funcionais e prioridades

Prioridades: **P0-M1** = necessário ao Web Assistido; **P1** = evolução do agente; **P2** = condicionado a gates específicos. A prioridade define a entrega, **não** a importância da visão final.

| ID | Requisito | Prioridade | Aceite essencial |
|---|---|---|---|
| **FR-01** | `Argonauta: Open` e view própria | P0-M1 | Painel abre/restaura no Antigravity real |
| **FR-02** | Abrir Gemini Web no navegador compatível | P0-M1 | Fluxo normal com fallback externo e limitações visíveis |
| **FR-03** | `Argonauta: Ask About Selection` | P0-M1 | Prompt usa somente seleção e metadados aprovados |
| **FR-04** | Seletor de contexto: seleção, arquivo e arquivos escolhidos | P0-M1 | Prévia por item e exclusão de trechos |
| **FR-05** | Copiar prompt com consentimento | P0-M1 | Clipboard recebe somente conteúdo aprovado |
| **FR-06** | Importar resposta/patch explicitamente | P0-M1 | Conteúdo inválido não grava arquivo |
| **FR-07** | Diferenças e aplicação/rejeição | P0-M1 | Escrita somente após aprovação, respeitando escopo |
| **FR-08** | Chat/atividade local e histórico | P0-M1 | Sessões diferenciadas do chat remoto e limpeza possível |
| **FR-08b** | Aviso de ciência e responsabilidade na primeira execução | P0-M1 | Exibir limites e obter confirmação antes de integrações externas |
| **FR-09** | Identificar modo e capacidade do provedor | P0-M1 | Sem confundir manual, indisponível e agente ativo |
| **FR-10** | Cancelamento, erros e logs sanitizados | P0-M1 | Sem exposição de segredos e com limpeza |
| **FR-11** | Temas, teclado, acessibilidade | P0-M1 | Navegação e contraste adequados |
| **FR-12** | Provedor de API oficial BYOK | P1 / condicional | Credencial segura, custo, streaming e falhas comprovados |
| **FR-13** | Planejamento e execução estruturada de ferramentas | P1 / G4 | Ferramentas listadas, escopos e aprovações verificados |
| **FR-14** | Terminal/testes autorizados | P1 / G4 | Exibir comando, diretório e efeitos antes de executar |
| **FR-15** | Revisão multi-arquivos, checkpoints, rollback | P1 / G4 | Alterações rastreáveis e reversão com limites explícitos |
| **FR-16** | Indexação/descoberta seletiva de contexto | P1 | Ignorar segredos, `.gitignore` e caminhos proibidos |
| **FR-17** | Ponte web bidirecional | P2 / G3-T+G3-W | Mecanismo técnico estável, testes E2E e usuário ciente dos riscos |
| **FR-18** | Agent loop sobre interface web | P2 / G3+G4 | Tool calling realmente disponível e autorizado |
| **FR-19** | Provedores adicionais intercambiáveis | P2 | Capabilities e UX desacopladas de cada backend |
| **FR-20** | **Ícone próprio e Activity Bar View Container** | P0-M1 | Ícone Argonauta visível, view aberta por clique e identificada |
| **FR-21** | **Área de tarefas, plano e atividade** | P0: estrutura; P1: execução | No MVP mostra etapas manuais; em G4 mostra ações reais, progresso e falhas |
| **FR-22** | **Modos Perguntar, Planejar e Agir** | P0: indicação; P1: funcional | `Agir` indisponível enquanto não houver backend e permissões comprovados |
| **FR-23** | **Indicadores de provedor/modelo e estado real** | P0: rótulos; P1/P2: integração | Não afirmar Gemini 4 Argon conectado sem teste e identificação confiável |
| **FR-24** | **Registro local de aprovações e operações** | P1 / G4 | Auditoria sanitizada de ação proposta, resultado e autorização |
| **FR-25** | **Isolamento das sessões e interrupção de tarefas** | P1 / G4 | Cancelar, fechar recursos, não repetir ações sem autorização |

**Não criar novos identificadores para renomear os requisitos existentes.** FR-20 a FR-25 complementam FR-01 a FR-19. A numeração dos marcos M0–M5, trilhas T01–T09, gates G0–G5 e etapas POC-05B 0–6 permanece estável.

### 9.1 Experiência visual esperada

- **Barra lateral:** ícone proprietário do Argonauta na Activity Bar do Antigravity e contêiner de views registrado pela API pública, quando suportada; painel persistente ao clicar no ícone.
- **Cabeçalho:** modo (Web Assistido, API Oficial, Web Bridge), estado do provedor/modelo, configurações, indicação de indisponibilidade e limitações.
- **Conversa:** mensagens, campo de prompt, anexos de contexto selecionados, histórico e ações de cancelar/repetir quando realmente implementadas.
- **Contexto:** inventário de arquivos, trechos e tamanho, filtros, exclusões, visualização e consentimento por operação.
- **Plano e atividade:** tarefas, etapas, ferramentas propostas, autorizações, resultado de testes e erros; estados simulados ou placeholders não podem aparentar execução real.
- **Revisão:** diff por arquivo, seleção de alterações, confirmação de aplicação e informações de reversão.
- **Configurações:** provedor, capacidades, exclusões, limites de contexto, histórico e privacidade.
- **Primeiro uso:** aviso de caráter experimental, responsabilidades, consentimento e informações de fornecedor externo.

A UI deve inspirar-se na **categoria funcional** de agentes populares, mas construir identidade visual e componentes próprios. Não adicionar promessas cosméticas de autonomia antes de conectar um backend legítimo.

### 9.2 Fluxos de uso

**Fluxo A — Web Assistido (M1):** abrir Argonauta → selecionar contexto → revisar e aprovar prompt → copiar e abrir navegador compatível → usuário interage manualmente com Gemini Web → importar resposta → revisar diff → aplicar/rejeitar explicitamente.

**Fluxo B — Agente via API oficial (M3, G4):** abrir painel → configurar chave oficial com custos claros → perguntar/planejar → aprovar ferramentas e escopos → orquestrador executa e apresenta eventos → revisar diffs/checkpoints → concluir/cancelar.

**Fluxo C — Agente conectado ao Gemini Web (M4, estritamente condicional):** somente definir contratos operacionais e ações de ferramenta depois de comprovar G3-T, G3-W e G4; não tratar login normal na página como integração programática.

## 10. Arquitetura de produto e componentes

### 10.1 Plataforma, dependências e estrutura

- **Host principal:** Antigravity IDE Windows, Extension Host local Node.js, API pública compatível com VS Code quando comprovada; `extensionKind: ["ui"]` para cenário local, sujeito a homologação.
- **UI:** `WebviewView` no Activity Bar ou alternativa pública suportada, com CSP restritiva, mensagens tipadas e assets locais; não incorporar Gemini Web dentro da Webview do Argonauta.
- **Linguagem:** TypeScript `strict`; npm workspaces nativos, sem toolchains orquestradoras extras sem justificativa.
- **Bibliotecas:** protocolos, contexto, segurança, sessões e revisões desacoplados do host e do provedor onde aplicável.
- **Aplicações:** `apps/ide-extension` quando houver código real; `apps/chrome-extension` e `apps/native-host` somente quando autorizados e implementados. Ferramentas de validação permanecem em `tools/`.
- **Baseline:** `packages/protocol`, `tools/compatibility-probe`, `tools/native-messaging-smoke`, `tests/integration` e CI Windows existentes. Não retornar à estrutura `experiments/`.
- **Portabilidade:** compatibilidade com VS Code, Linux e macOS permanece alvo futuro, sujeita a testes específicos.

### 10.2 Separação de responsabilidades

```text
Antigravity IDE (editor, workspace, comandos, terminal)
  └─ Ícone Argonauta / Activity Bar
      └─ Painel próprio: conversa, contexto, plano, atividade, diffs
          └─ Núcleo da extensão
              ├─ Adaptador do host e compatibilidade
              ├─ Contexto + filtros de privacidade
              ├─ Sessões + histórico local
              ├─ Composer de prompts
              ├─ Parser de patches + revisão de diff
              ├─ Orquestrador de tarefas e ferramentas
              ├─ Gate de permissões e registro de decisões
              └─ Registro de provedores/capacidades
                  ├─ Web Assistido: copiar/abrir/importar (M1)
                  ├─ API Oficial: backend programático (M3/G4)
                  └─ Web Bridge: canal e web permitidos (M4/G3/G4)
```

O núcleo da extensão jamais deve depender de DOM privado do Gemini Web. A escolha de provedor não pode alterar os controles de aprovação de ferramenta. O Web Assistido não implementa falsamente streaming, tool calling ou agent loop.

### 10.3 Capacidades de provedor (contrato conceitual)

```ts
interface CapacidadesProvedor {
  abrirPaginaWeb: boolean;
  transferirPromptManual: boolean;
  importarRespostaManual: boolean;
  respostasProgramaticas: boolean;
  streaming: boolean;
  chamadasDeFerramenta: boolean;
  selecionarModelo: boolean;
}

interface AdaptadorProvedor {
  readonly id: string;
  obterCapacidades(): CapacidadesProvedor;
  obterEstado(): Promise<'pronto' | 'configuracao_pendente' | 'indisponivel'>;
}
```

**Este código é descritivo, não contrato implementado.** Métodos adicionais só poderão ser congelados após experimentos com provedores reais. Capacidade declarada `true` exige evidência. Mostrar seleção de modelo não implica que determinado modelo esteja acessível via API.

### 10.4 Segurança da ponte (pesquisa separada)

A POC-05B pretende conectar IDE ↔ Windows Named Pipe ↔ Native Messaging Host ↔ extensão Chrome MV3. Requisitos específicos: DACL efetiva do usuário/logon autorizado, rejeição remota, primeira instância, identidade, limites de recursos, autenticação mútua HMAC na etapa adequada e testes negativos. **`node:net` como servidor foi reprovado**, e a investigação Win32 da ADR-0003 não produziu helper por ausência de toolchain no ambiente. A POC permanece `blocked`; não criar servidor funcional inseguro nem adotar TCP como fallback silencioso.

O êxito dessa ponte **não aprova** o uso de Gemini Web como backend. A revisão de G3-W é independente e indispensável.

## 11. Requisitos não funcionais

### 11.1 Segurança

- Respeitar `vscode.workspace.isTrusted`, escopo de execução local, autorização por operação e modo restrito.
- Caminhos e symlinks não podem permitir escrita fora das raízes aprovadas; validar canonicalização, concorrência e conteúdo do patch.
- Tratar código do projeto, texto importado e saída de modelos como dados não confiáveis; impedir prompt injection sobre permissões.
- Exigir aprovação de mudanças e ações de terminal/externas, mostrando comando, diretório, arquivos-alvo e efeito possível.
- Não executar diretamente scripts recebidos de modelos ou documentos sem revisão.
- Não usar credenciais Google, cookies, 2FA ou tokens de sessão; segredos de API próprios devem usar armazenamento seguro e nunca aparecer em logs.
- Isolar mensagens de Webview e processos; CSP estrita, validação de schema, limites de memória/tempo e tratamento de backpressure.
- Evitar portas de rede e serviços residentes no MVP; qualquer transporte futuro requer gate e threat model específicos.
- Proteger processos auxiliares com identidade, DACL e encerramento determinístico; validações negativas são obrigatórias.

### 11.2 Privacidade

- Sem telemetria nem upload automático do workspace por padrão.
- Contexto explícito, prévia por arquivo/trecho e exclusão de `.env`, chaves privadas, certificados, tokens e padrões sensíveis.
- Cumprir `.gitignore` e regras adicionais configuráveis; não presumir que isso, isoladamente, elimina todos os segredos.
- Histórico local opcional, com limpeza e retenção documentadas; não registrar código privado em diagnósticos públicos sem consentimento.
- Informar que conteúdo enviado ao Gemini Web ou API fica sujeito às políticas do respectivo serviço.

### 11.3 Confiabilidade, desempenho e UX

- Inicialização sob demanda; UI responsiva, carregamento e cancelamento previsíveis.
- Limites para arquivos, trechos, tamanho do prompt, tarefas, filas e processos.
- Erros e estados em linguagem compreensível; indisponibilidade de provedor não deve causar perda silenciosa de alterações.
- Edições transacionais quando possível, identificação de conflitos, checkpoint e plano de recuperação.
- Acessibilidade: teclado, foco, rótulos, contraste, temas e layout redimensionável.

### 11.4 Idioma e comunicação

A ambição histórica do PRD é disponibilizar interface e divulgação internacionalizadas, incluindo inglês e pt-BR. **A política vigente do repositório exige conteúdo gerado em pt-BR**. Até nova decisão explícita do mantenedor sobre a política, novas strings, documentos e mensagens devem respeitar `AGENTS.md` e `.agents/rules/language.md`. Internacionalização é requisito de arquitetura, não licença para descumprir as regras atuais.

## 12. Critérios de aceite do M1 — primeiro produto utilizável

- [ ] Extensão instala/abre no Antigravity IDE real, sem depender do aplicativo VS Code.
- [ ] Ícone Argonauta aparece na **Activity Bar**, abre o painel dedicado e mantém estado adequado ao recarregar.
- [ ] `Argonauta: Open` funciona; `Argonauta: Ask About Selection` usa APIs públicas e apresenta prévia.
- [ ] Painel identifica corretamente Web Assistido, API Oficial e Web Bridge, bloqueando modos indisponíveis.
- [ ] Contexto selecionado é filtrado, inspecionável e editável/removível antes de copiar/transferir.
- [ ] Gemini Web abre em navegador legítimo compatível; falha do integrado tem fallback externo e descrição honesta.
- [ ] Usuário importa resposta explicitamente, visualiza diff por arquivo e aprova/rejeita alterações.
- [ ] Nenhuma escrita prévia à autorização; negação de escapes do workspace e de arquivos sensíveis.
- [ ] Workspace não confiável e falhas/cancelamentos são tratados com segurança.
- [ ] Histórico local, sessão, privacidade e limpeza funcionam; nenhuma resposta manual é apresentada como sincronização automática.
- [ ] Termo inicial de ciência e responsabilidade informa experimentalidade e políticas de terceiros antes de acesso externo.
- [ ] Testes unitários, integração, compilação, typecheck, empacotamento VSIX, regressões e validação manual documentada passam.
- [ ] README, SECURITY, licença, matriz de compatibilidade e comunicação de capacidades estão consistentes com o produto testado.

**M1 não exige agent loop nem integração Gemini Web bidirecional.** Concluí-lo significa entregar um primeiro produto útil, não declarar cumprida a visão agêntica ou o objetivo específico da assinatura Pro.

### 12.1 Critérios futuros de aceite de um agente real (G4)

- [ ] Backend programático legítimo com status, identidade de provedor e capacidades verificáveis.
- [ ] Respostas do modelo e chamadas de ferramenta reais, com autenticação e tratamento de erros.
- [ ] Plano, execução de etapas, cancelamento, limites e histórico de atividade.
- [ ] Contexto de projeto controlado, decisões explícitas de autorização e proteção contra prompt injection.
- [ ] Alterações de múltiplos arquivos com revisão, diffs, testes, checkpoints e recuperação.
- [ ] Testes de segurança, E2E em Antigravity e documentação de limitações.
- [ ] Para anunciar **Gemini Web/Argon agêntico com assinatura Pro**, aprovação adicional e independente de **G3-T e G3-W**, mais evidência do modelo e da conta autorizados.

## 13. Estratégia de testes

### 13.1 Automatizados

- Componentes: seletor de contexto, filtro de segredos, prompt, sessões, parser de patch, permissões e capacidades de provedor.
- Integração: editor → contexto → prompt; importação → diff → edição autorizada.
- Segurança: traversal, symlinks, conflitos, comandos não autorizados, payload inválido, prompt injection, vazamento de segredo e Workspace Trust.
- Robustez: cancelamento, Unicode, erros de provedor, backpressure, reinício do host e recuperação de sessão.
- POC-05B: framing e fixtures preservados; testes negativos de DACL/acesso remoto não podem ser substituídos por testes de protocolo.

### 13.2 Matriz manual

| Ambiente | Validação do MVP | Comunicação de suporte |
|---|---|---|
| Antigravity IDE / Windows | **Obrigatória, primeiro** | Suporte inicial somente se testado |
| Antigravity / Linux/macOS | Posterior, se ambiente disponível | Não presumir |
| VS Code / Windows | Posterior ou por colaboradores | Não anunciar sem evidência |
| VS Code / Linux/macOS | Posterior | Não anunciar sem evidência |
| Outros hosts | Sob demanda | Não anunciar sem evidência |

Todas as evidências incluem data, commit, versão IDE/SO e método. Capturas ocultam e-mails, identificadores, credenciais, projetos privados e demais informações sensíveis. CI valida o que é executável no pipeline, não interações manuais do Chrome ou Antigravity.

## 14. Marcos e trilhas — referência ao ROADMAP.md

A taxonomia do `ROADMAP.md` é a referência operacional: **M0–M5**, **T01–T09**, **G0–G5** e POC-05B Etapas 0–6 não devem ser renumerados nem tratados como equivalentes.

| Marco | Resultado de produto | Dependência e estado |
|---|---|---|
| **M0 — Foundation & Discovery** | Fundação, host, hipóteses, POCs e decisões | Em progresso; POC-05B bloqueada sem impedir M1 |
| **M1 — Extensão Agêntica Real & VSIX** | **Primeiro aplicativo real** em `apps/ide-extension/` com Activity Bar, painel integrado, núcleo de agente, ferramentas autorizadas, revisão de diff e pacote `.vsix` instalável; inclui fallback manual Web Assisted | Planejado; não depende de G3 |
| **M2 — Beta open source** | Segurança, acessibilidade, testes E2E, documentação e experiência refinada | Depende de M1 |
| **M3 — Official API Agent** | Agente verdadeiro com API oficial, BYOK e ferramentas autorizadas | Condicional a capacidades, acesso e G4 |
| **M4 — Web Bridge** | Integração legítima com experiência web e possível agência sobre ela | Exige G3-T + G3-W e G4 para agent loop |
| **M5 — Publicação e manutenção** | Releases transparentes, governança e publicação formal em lojas homologadas (Open VSX/Marketplace) | Exige G5, licença e publisher formalizados |

**Ordem de valor:** consolidar a fundação e focar na implementação da extensão real M1 em `apps/ide-extension/` (T04–T06), tratando provedores externos como dependências desacopladas, enquanto T03/POC-05B e a avaliação G3-W prosseguem como trilhas de risco separadas. **Não equiparar bloqueio de IPC a bloqueio do produto.** A geração do `.vsix` instalável é entrega técnica de M1; a publicação em lojas pertence a M5.

## 15. Comunicação, transparência e lançamento

### Afirmações permitidas somente quando demonstradas

- “Extensão Argonauta com painel próprio no Antigravity IDE”.
- “Fluxo assistido de contexto e revisão de código com Gemini Web”.
- “Agente de programação com API oficial”, quando streaming/ferramentas/autorização forem comprovados.

### Afirmações condicionadas a evidência adicional

- “Agente autônomo com Gemini 4 Argon por meio do Google AI Pro”.
- “Gemini Web funciona como API de agente sem credencial de API”.
- “Argonauta usa automaticamente sua assinatura Pro dentro da IDE”.
- “Acesso ilimitado ao Argon”.
- “Compatível com todas as IDEs baseadas em VS Code”.

Não comunicar nenhuma delas sem provas técnicas reproduzíveis, análise da autorização aplicável e escopo de disponibilidade. README, marketplace e demonstrações devem apresentar o modo realmente implementado, não a visão futura como funcionalidade existente.

A divulgação open source pode incluir vídeos sem cortes, benchmarks reproduzíveis, ADRs, relatórios, issues e matriz de suporte. O projeto é independente e não afiliado aos provedores mencionados.

## 16. Riscos e respostas

| Risco | Efeito | Resposta |
|---|---|---|
| Gemini Web/Argon ter instabilidade técnica ou mudanças | Inviabiliza fluxo automatizado por quebra de interface | Focar em estabilidade técnica e segurança; não impor travas de desenvolvimento; usuário ciente dos riscos |
| O modelo mudar de nome, elegibilidade ou disponibilidade | Instabilidade do provedor | Não acoplar arquitetura à versão específica |
| Navegador integrado não carregar Gemini Web | Falha de UX integrada | Fallback legítimo externo; não atribuir causa sem diagnóstico |
| IPC Windows inseguro ou helper não validado | Acesso indevido ao transporte | Gate bloqueante, ADRs, provas negativas e fail closed |
| Investimento excessivo em POCs sem experiência de usuário | Produto fica indefinidamente sem entrega | Priorizar painel e M1; exigir vínculo entre tarefas e requisitos |
| Vazamento de código ou segredos | Exposição de informação | Seleção, filtro, prévia, aprovação e testes |
| Prompt injection / ações destrutivas | Compromete projeto ou ambiente | Orquestrador restritivo, aprovação e rollback |
| Dependência de DOM/interface web volátil | Quebras de automação | Manter arquitetura modular desacoplada e usuário orientado |
| Confusão entre assinatura Pro e API | Promessas enganosas, custos não previstos | Separar modos, cobrança e gates |
| Conflito de marca ou rejeição em marketplace | Impede distribuição | Revisar identidade, política, licença e compatibilidade |
| Incompatibilidade entre hosts | Falhas após instalação | Matrix e testes por host; Antigravity-first |
| Sanções ou restrições de terceiros ao usuário | Risco operacional para o usuário | Isenção de responsabilidade clara (AS IS / at your own risk), avisos transparentes e ciência de riscos assumida pelo usuário |

## 17. Decisões arquiteturais e de produto ainda abertas

Preservar a distinção entre o backlog de decisões do PRD e os ADRs efetivamente existentes no repositório; não reutilizar seus números de forma ambígua.

| Tema | Decisão pendente | Quando decidir |
|---|---|---|
| Licença | MIT ou Apache-2.0, a escolher pelo mantenedor | Antes do release |
| Publisher/ícone/marca | Identidade definitiva e direitos de uso | Antes da publicação |
| Versão mínima de host | Basear na matriz de compatibilidade | Antes do MVP distribuível |
| UI e tecnologia | `WebviewView` com solução mínima sustentável | Primeiro incremento M1 |
| Política de patch | Parser restritivo, arquivos e aprovações | M1 |
| Histórico de sessão | Persistência opcional, exclusão, retenção | M1 |
| Idiomas do produto | Estratégia de i18n compatível com regras atuais | Antes de interface multilíngue |
| API oficial | Provedor, modelo, custos e BYOK | M3 |
| Web Bridge | Resultado de G3-T e G3-W, consentimento e implementação legítima | Antes de M4 |
| Helper Win32 | Toolchain, binário, provas de DACL e manutenção | POC-05B Etapa 2, ainda bloqueada |

Referências existentes: `docs/architecture/decisions/0001-monorepo-architecture.md`, `0002-node-net-security-gate.md`, `0003-win32-named-pipe-security-probe.md` (esta última é **proposta**, não homologação do helper).

## 18. Próximas ações recomendadas

1. **Aprovar o norte do produto e este PRD revisado** sem converter capacidades previstas em capacidades implementadas.
2. **Iniciar o primeiro incremento real de M1:** criar `apps/ide-extension` com ícone Activity Bar, view dedicada, `Argonauta: Open`, `Argonauta: Ask About Selection`, prévia e consentimento, sem fingir conexão agêntica.
3. **Priorizar pesquisa G3-W em paralelo:** verificar mecanismo e permissão de uso programático do Gemini Web/Argon, separado da engenharia IPC.
4. Manter a **POC-05B Etapa 2 como `blocked`** até ambiente Win32 e provas reais; não iniciar Etapa 3 prematuramente.
5. Corrigir as referências editoriais e datas-base desatualizadas do `ROADMAP.md` em tarefa separada, sem reescrever seus identificadores estáveis.
6. Preparar execução end-to-end do MVP em Antigravity e critérios de G2, sem instalar VS Code como pré-requisito.
7. Nenhum commit, push, merge, instalação de SDK ou modificação do Registro sem solicitação específica do mantenedor.

## 19. Referências principais

### Fontes internas do projeto

- [Repositório e código](https://github.com/LKSFerreira/argonauta).
- [Regras do agente](AGENTS.md) e [diretrizes de idioma](.agents/rules/language.md).
- [Roadmap](ROADMAP.md) — marcos, trilhas, gates e estados.
- [Arquitetura](docs/architecture/overview.md) e [desenho da ponte](docs/architecture/bridge-design.md).
- [Modelo de ameaças](docs/security/threat-model.md).
- [ADR-0002](docs/architecture/decisions/0002-node-net-security-gate.md), [ADR-0003](docs/architecture/decisions/0003-win32-named-pipe-security-probe.md).
- [Validação IPC](docs/validation/ipc-transport.md) e [investigação Win32](docs/validation/ipc-win32-feasibility.md).

### Documentação externa de referência

- [Extensões e Webviews do VS Code](https://code.visualstudio.com/api/extension-guides/webview).
- [Workspace Trust](https://code.visualstudio.com/api/extension-guides/workspace-trust).
- [Documentação de publicação de extensões](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
- [Open VSX](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions).
- [Cobrança da Gemini API](https://ai.google.dev/gemini-api/docs/billing), independente de direitos da assinatura Google AI Pro.
- [Termos do Google](https://policies.google.com/terms).
- [Privacidade dos aplicativos Gemini](https://support.google.com/gemini/answer/13594961?hl=pt-BR).
- [Segurança de Windows Named Pipes](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights).

---

**Critério decisivo:** o Argonauta deve ser desenvolvido como uma **extensão agêntica de programação com identidade e experiência próprias**. Usar **Gemini Web/Argon com Google AI Pro** permanece a **hipótese distintiva que motivou o projeto**, porém somente poderá ser anunciado como backend funcional quando houver integração real, reproduzível, segura e permitida. Enquanto isso, os incrementos publicados devem identificar honestamente suas capacidades e construir o núcleo de produto, não apenas infraestrutura.
