# Argonauta — Product Requirements Document (PRD)

> **Tagline (proposta):** Navigate beyond the limits.
>
> **Produto:** Argonauta — extensão independente desenvolvida e validada primeiro para Antigravity IDE, com compatibilidade futura com VS Code.
>
> **Versão do documento:** 0.1.1 (rascunho para validação; Antigravity IDE-first)
>
> **Data:** 14 de outubro de 2026
>
> **Status:** Discovery / prova de conceito; **nenhuma integração com o Gemini Web foi validada**.
>
> **Idioma do planejamento:** Português (Brasil). **Idioma principal do produto e da divulgação:** Inglês, com estrutura pronta para localização PT-BR.

## 1. Resumo executivo

**Argonauta** é uma extensão open source concebida **primeiro para o Antigravity IDE**, onde o mantenedor desenvolve, executa e testa seus projetos. Como objetivo posterior, buscará compatibilidade com **Visual Studio Code** e outras IDEs que exponham APIs compatíveis. Sua finalidade é aproximar a experiência de modelos de IA disponíveis em interfaces web do fluxo de desenvolvimento dentro da IDE.

A oportunidade inicial surgiu quando assinantes **Google AI Pro** passaram a conseguir selecionar **Gemini 4 Argon** no aplicativo web Gemini, enquanto o acesso ao mesmo modelo não estava disponível na seleção nativa de agentes do Antigravity IDE/CLI para esse nível de assinatura (observação do idealizador em 14/10/2026; disponibilidade sujeita a mudanças).

O objetivo **não** é afirmar que a assinatura Pro dá direito de consumir a API Gemini, desbloquear limites ou contornar controles de acesso. O objetivo é investigar se uma experiência de desenvolvimento assistido pode ser oferecida **usando os caminhos de acesso legitimamente disponibilizados ao usuário**, com autorização explícita, segurança, transparência e respeito aos termos aplicáveis.

**Ambiente exclusivo de desenvolvimento do mantenedor:** **Antigravity IDE**. O VS Code não é ferramenta necessária para criar, editar, depurar ou empacotar este projeto. Seu uso em testes de compatibilidade poderá ser delegado a voluntários ou adiado para uma etapa posterior.

**Visão de longo prazo:** uma experiência de agente de programação — chat contextual, sugestões, diffs, aplicação de alterações, ferramentas locais e sessões — com backends intercambiáveis.

**Hipótese de alto risco:** uma integração bidirecional e sustentável com o Gemini Web poderá ser construída usando mecanismos permitidos e estáveis. **Essa hipótese ainda não está provada.** Um navegador incorporado ou uma aba do Gemini **não** equivale a um agente programático.

## 2. Problema e oportunidade

### 2.1 Problema

- Alguns assinantes conseguem usar um modelo no **Gemini Web**, mas não conseguem selecioná-lo nos recursos de agente de suas IDEs com o mesmo plano.
- Copiar código manualmente entre navegador e editor interrompe o fluxo de trabalho, dificulta contexto e aumenta risco de aplicar mudanças sem revisão.
- Extensões que prometem “usar o modelo da web como API” frequentemente dependem de interfaces privadas, cookies de sessão ou automação frágil, o que traz riscos de segurança, disponibilidade e conformidade.

### 2.2 Oportunidade

Oferecer uma experiência **IDE-first**, começando com um fluxo web **assistido e verificável**, e evoluindo para autonomia apenas quando houver um canal de comunicação tecnicamente demonstrado e permitido.

### 2.3 Proposta de valor

**Para o desenvolvedor:** acessar o fluxo de raciocínio disponível na sua própria conta web sem sair desnecessariamente do contexto de programação; enviar trechos com controle de privacidade, receber soluções, visualizar diffs e aplicar mudanças de modo seguro.

**Para a comunidade:** alternativa open source, auditável, sem coleta de credenciais e com linguagem clara sobre o que é — e não é — suportado.

### 2.4 Posicionamento e marca

- **Nome de trabalho:** Argonauta.
- **Slug do repositório/extensão (proposto):** `argonauta`.
- **Slogan de trabalho:** *Navigate beyond the limits.*
- **Tom:** técnico, ousado, transparente; sem alegações enganosas de desbloqueio.
- **Independência:** não é produto oficial, patrocinado ou afiliado ao Google, Microsoft ou Anthropic.
- **Identidade visual:** evitar logos oficiais, marcas confundíveis ou aparência de extensão oficial.
- **Antes do lançamento:** confirmar disponibilidade de nome, publisher, domínio e eventuais conflitos de marca.

## 3. Público-alvo e cenários de uso

| Perfil | Necessidade | Prioridade |
|---|---|---|
| Desenvolvedor com Google AI Pro e Argon disponível no Gemini Web | Trabalhar com seu código enquanto utiliza a experiência web já oferecida à conta | Primário |
| Usuário do Antigravity IDE | Fluxo integrado mesmo sem o Argon no seletor nativo | **Prioridade P0 — plataforma principal** |
| Usuário do VS Code | Interface consistente de assistência à programação e revisão de patches | **Secundário — validar após MVP no Antigravity** |
| Desenvolvedor com chave de API oficial | Agente com backend programático e ferramentas estruturadas | Secundário; caminho de autonomia |
| Mantenedor open source | Auditar segurança e contribuir com provedores/adapters | Secundário |

### 3.1 Jobs to be done

1. **Enquanto programo**, quero pedir ajuda sobre a seleção/arquivo/projeto sem recriar manualmente todo o contexto.
2. **Antes de alterar arquivos**, quero visualizar exatamente o que será modificado e poder aprovar ou rejeitar.
3. **Quando uso Gemini Web**, quero manter a autenticação sob controle do navegador/Google, sem entregar senha ou cookies à extensão.
4. **Se a integração web não for possível**, quero uma alternativa honesta e útil, sem fingir que estou usando um agente autônomo.

## 4. Objetivos, métricas e limites

### 4.1 Objetivos de produto

**O1 — Viabilidade técnica:** estabelecer, mediante experimento reproduzível **no Antigravity IDE**, se Gemini Web autenticado e Argon podem funcionar dentro de um navegador integrado do host; usar navegador externo como alternativa quando necessário.

**O2 — UX mínima útil:** usuário consegue selecionar contexto no editor, montar um prompt, acessar Gemini, copiar/importar uma resposta e revisar/aplicar um patch com segurança.

**O3 — Evolução controlada:** criar arquitetura de provedores para adicionar um backend programático **oficial** sem reescrever a UI e o orquestrador.

**O4 — Credibilidade:** entregar extensão auditável, documentação em inglês, matriz de compatibilidade real e demonstrações reproduzíveis.

### 4.2 Métricas de validação (metas iniciais, não resultados)

| Métrica | Meta para a prova de conceito / beta | Método |
|---|---|---|
| Abertura do Gemini | Passar primeiro no Antigravity IDE; VS Code só após estabilização | Roteiro manual |
| Login Google | Funcionar de forma normal; **sem captura de credenciais** | Teste em conta própria |
| Visibilidade do Argon no navegador integrado | Aparecer e responder na conta Pro testada | Evidência com data, versão e dados pessoais ocultos |
| Fluxo seleção → prompt | Concluir em até 3 ações deliberadas do usuário | Teste de usabilidade |
| Aplicação segura de patches | 100% das gravações precedidas de revisão/aprovação no MVP | Testes automatizados e manuais |
| Vazamento de credenciais nos logs | 0 ocorrências | Inspeção e testes |
| Compatibilidade | Reportar resultados por versão de IDE e SO, não presumir compatibilidade | Matriz de testes |
| Qualidade do release | Build, lint, testes unitários e empacotamento VSIX sem erros | CI |

### 4.3 Não objetivos (versão inicial)

- Transformar a assinatura Google AI Pro em créditos de API.
- Ignorar paywalls, níveis de assinatura, limites de uso, desafios antiabuso ou controles de autenticação.
- Usar endpoints privados, tokens ou cookies extraídos de sessões para imitar a API Gemini.
- Garantir automação em segundo plano do Gemini Web.
- Executar comandos arbitrários sem aprovação.
- Enviar automaticamente todo o workspace para serviços externos.
- Reproduzir integralmente o design proprietário de outro produto.

## 5. Princípios de projeto e restrições inegociáveis

1. **Verdade sobre capacidades.** Separar claramente *Web Assistido*, *API Oficial* e qualquer capacidade experimental futura. Não chamar o modo web de “agente autônomo” sem comprovação funcional.
2. **Respeito à conta do usuário.** Login só nos fluxos legítimos do Google; não solicitar senha, 2FA, cookie de sessão, bearer token ou exportação de perfil de navegador.
3. **Acesso permitido.** Sem contornar bloqueios de origem, paywalls, CAPTCHA, proteção anti-bot ou controles de plataforma. Avaliar termos e permissões antes de qualquer automação do site.
4. **Local-first.** Leitura de arquivos, construção de contexto, parsing e diffs ocorrem localmente; apenas conteúdo explicitamente aprovado pode ser enviado ao provedor.
5. **Consentimento informado.** O usuário vê os arquivos/trechos que serão compartilhados e autoriza mudanças em disco e ações no terminal.
6. **Mínimo privilégio.** Respeitar Workspace Trust e diretórios excluídos; negar operações fora do workspace por padrão.
7. **Adapters isolados.** UI e ferramentas de IDE não dependem de detalhes de DOM, endpoints ou implementação do Gemini Web.
8. **Degradação elegante.** Se um fluxo web não funcionar, informar e oferecer modo externo/manual, sem invocar rotas não documentadas.
9. **Open source de verdade.** Licença definida antes do primeiro release; dependências e artefatos auditáveis; changelog e security policy.
10. **Uso por conta e risco (*at your own risk*).** O Argonauta é fornecido "no estado em que se encontra" (*AS IS*), sem garantias de qualquer natureza. O usuário utiliza a extensão por sua exclusiva conta e risco, assumindo total responsabilidade pelo cumprimento dos Termos de Serviço de provedores terceiros e pelas decisões de compartilhamento e alteração de código.

### 5.1 Isenção de responsabilidade e termos do usuário (Disclaimer)

O Argonauta é um projeto independente de código aberto. A sua utilização submete-se estritamente aos seguintes termos:

- **Responsabilidade perante terceiros:** O usuário é o único e exclusivo responsável por ler, compreender e cumprir integralmente os Termos de Serviço, Políticas de Uso Aceitável e restrições de automação ou uso de API de quaisquer serviços de terceiros acessados (incluindo, sem limitação, Google, Microsoft, Anthropic ou OpenAI).
- **Inexistência de garantias contra sanções:** O Argonauta, seus mantenedores e colaboradores não garantem que qualquer método de interação ou automação esteja isento de detecção, bloqueio de requisições, restrições temporárias ou suspensão/banimento de contas por parte de provedores terceiros. O usuário assume expressamente todo e qualquer risco relativo à sua conta ou assinatura.
- **Fornecimento "no estado em que se encontra" (*AS IS*):** O software é disponibilizado sem garantias expressas ou implícitas de comercialização, adequação a um propósito específico, disponibilidade contínua ou ausência de erros.
- **Responsabilidade sobre dados e código-fonte:** Cabe exclusivamente ao usuário revisar todo e qualquer trecho de código ou metadado antes de autorizar o envio a interfaces externas, bem como inspecionar minuciosamente diffs e patches gerados por IA antes de sua aplicação ao workspace. Os mantenedores não respondem por vazamentos de segredos, perdas de dados, regressões no código ou danos diretos/indiretos decorrentes do uso da ferramenta.

## 6. Hipóteses, certezas e riscos abertos

| ID | Hipótese/pergunta | Estado em 14/10/2026 | Como decidir |
|---|---|---|---|
| H-01 | Conta Pro vê Argon no Gemini Web | **Observado** nas capturas do idealizador; não generalizar a todos os usuários | Repetir na conta de teste |
| H-02 | VS Code dispõe de navegador integrado | **Documentado para VS Code; não inferir suporte no Antigravity** | Pesquisa/documentação; teste de compatibilidade posterior |
| H-03 | Gemini Web aceita login no navegador integrado **do Antigravity**, se houver | **Não validado** | POC-02 |
| H-04 | Argon está disponível após login no navegador integrado | **Não validado** | POC-03 |
| H-05 | Antigravity IDE contém navegador integrado equivalente ao do VS Code | **Não validado; hipótese prioritária** | POC-01 e POC-02 |
| H-06 | Extensões podem controlar/observar a aba web de maneira **suportada e autorizada** | **Não comprovado** | POC-05 + análise de APIs/termos |
| H-07 | É possível construir um agente autônomo sobre Gemini Web com integração permitida | **Alto risco / não comprovado** | Gate G3; não prometer antecipadamente |
| H-08 | Gemini API pode sustentar modo agente próprio | **Viável em princípio com acesso e faturamento separados** | POC-07 e disponibilidade do modelo na API |
| H-09 | Open VSX e Visual Studio Marketplace aceitarão a extensão | **Não garantido** | Revisão de políticas + homologação |

> **Importante:** o recurso do VS Code que permite compartilhar páginas com agentes nativos não prova que extensões independentes recebam a mesma interface programática. Essa diferença é objeto de investigação, não premissa arquitetural.

## 7. Experimentos de descoberta (antes da implementação extensa)

> **Ordem obrigatória do projeto:** POC-01 → POC-02 → POC-03 → POC-05/06, **sempre no Antigravity IDE**. A POC-04 (VS Code) é uma trilha posterior de portabilidade e não bloqueia desenvolvimento, testes ou publicação inicial no Open VSX.

Os experimentos abaixo são **sequenciais e com registro de evidências**. Executar apenas em contas e ambientes próprios/autorizados.

### POC-01 — Inventário e versão dos hosts

**Procedimento:** registrar **Antigravity IDE** instalado, versão, SO, disponibilidade da paleta de comandos, navegador integrado e versão do mecanismo de extensões. Não exigir instalação de VS Code. Registrar outros hosts apenas se forem testados depois.

**Saída:** `docs/validation/compatibility-matrix.md` com host, versão, SO, data e resultado.

**Aceitação:** matriz preenchida; recursos não existentes marcados como `unsupported`, nunca assumidos.

### POC-02 — Gemini Web no navegador integrado do Antigravity IDE

**Procedimento:** **no Antigravity IDE**, verificar primeiro se existe um comando equivalente a **Browser: Open Integrated Browser**. Se disponível, abrir manualmente `https://gemini.google.com/app`, navegar e realizar login pela interface oficial. Se o comando estiver ausente ou falhar, marcar como `unsupported` ou `fail`, testar o navegador externo e registrar o limite; **não presumir** que o Antigravity implementa o recurso do VS Code.

**Não fazer:** injetar scripts de login, acessar cookie jar, enfraquecer políticas de segurança ou desativar proteções.

**Aceitação:** página utilizável **no Antigravity IDE**, sem interceptação de credenciais; registrar ausências e falhas como resultados legítimos, não como motivo para contornar proteções.

### POC-03 — Disponibilidade e interação com Argon

**Procedimento:** verificar seletor de modelos e possibilidade de conversa, em modo mínimo/médio/máximo se disponível, apenas por interação normal. Comparar com navegador externo na mesma conta.

**Aceitação:** pelo menos uma conversa bem-sucedida com o Argon **dentro** do navegador integrado; guardar evidências anonimizadas. Se não funcionar, registrar o bloqueio e interromper hipóteses dependentes.

### POC-04 — Compatibilidade com VS Code (posterior e opcional)

**Procedimento:** **após a validação no Antigravity IDE**, verificar em VS Code se o mesmo VSIX abre o navegador integrado, apresenta a interface e suporta os comandos da extensão. Essa validação pode ser executada por colaboradores; **não requer que o mantenedor programe no VS Code**.

**Aceitação:** resultado explícito `pass/fail/unsupported` com versão e reprodução. A ausência do VS Code **não bloqueia** o MVP direcionado ao Antigravity.

### POC-05 — Fronteira extensão ↔ navegador

**Perguntas de teste:**

- Existe uma **API pública e documentada** para a extensão abrir/focar uma URL no navegador integrado?
- Existe mecanismo público e autorizado para a extensão obter conteúdo ou intercambiar mensagens com a aba de terceiros?
- Há separação clara entre ferramentas de **agentes nativos do VS Code** e APIs acessíveis às extensões?
- Os termos do Google permitem o fluxo de integração pretendido?

**Aceitação:** decisão documentada com link para API e testes **no Antigravity IDE**; **não** considerar `executeCommand` interno/não documentado como contrato estável de produção.

**Bloqueio:** se não houver canal permitido para integração bidirecional, **não** implementar automação por sessão/cookies/endpoints privados. Prosseguir somente com modo assistido.

### POC-06 — MVP de transferência manual de contexto/patch

**Procedimento:** selecionar código no editor, gerar prompt com caminho/linguagem/trecho, copiar para a área de transferência após confirmação, usar Gemini Web, trazer resposta/patch para a extensão e mostrar diff.

**Aceitação:** completar o fluxo sem acesso programático à página do Google; nenhuma alteração sem confirmação explícita.

### POC-07 — Provedor com API documentada (em paralelo, opcional)

**Procedimento:** implementar um provedor de teste usando uma API oficial configurada com chave própria e limites/cobrança informados ao usuário; validar streaming, erros, cancelamento e tool-calling quando suportado.

**Aceitação:** contrato de provedor testado independentemente da UI; backend de referência funcionando. **Não supor que Google AI Pro inclua uso da Gemini API.**

### Modelo de relatório de experimento

Cada POC cria um arquivo com: `ID`, `data`, `SO`, `versões`, `pré-condições`, `passos exatos`, `resultado esperado`, `resultado observado`, `evidência sem dados pessoais`, `impacto` e `decisão`.

## 8. Gates: critérios para avançar ou interromper

| Gate | Pré-requisito | Decisão |
|---|---|---|
| **G0 — Discovery** | H-01/H-02 registrados e cenários definidos | Iniciar testes |
| **G1 — Web utilizável** | POC-02 + POC-03 aprovadas **no Antigravity** (ou fallback externo viável) | Construir UX de abertura/navegação para Antigravity primeiro |
| **G2 — MVP útil sem automação web** | POC-06, diff, consentimento e testes básicos | Lançar beta **Web Assistido** se houver valor claro |
| **G3 — Integração bidirecional** | Canal técnico permitido, documentado, testável e compatível com termos | Considerar sincronização avançada |
| **G4 — Agente autônomo** | G3 **ou** API oficial; tool-calling e permissões testados | Lançar funções de agente com nome correto |
| **G5 — Publicação** | Segurança, compatibilidade, licença, documentação e revisão das lojas | Publicar nas lojas aprovadas |

**Critério de pivot:** se G3 falhar, Argonauta pode continuar como assistente web **manual** + agente via **API oficial**, mas **não** será anunciado como “Argon web autônomo no Antigravity IDE”.

## 9. Escopo funcional por prioridade

Legenda: **P0** = necessário para MVP; **P1** = próxima versão; **P2** = futuro condicionado à validação.

| ID | Requisito | Prioridade | Dependência | Critério de aceitação |
|---|---|---|---|---|
| FR-01 | Comando `Argonauta: Open` e view própria | P0 | SDK do host | Painel abre e restaura sem erros |
| FR-02 | Acesso a Gemini Web por navegador compatível (integrado ou externo) | P0 | G1 para modo integrado | Abre fluxo normal e informa limitações |
| FR-03 | Comando `Argonauta: Ask About Selection` | P0 | VS Code API | Prompt contém somente seleção e metadados aprovados |
| FR-04 | Seletor de contexto: seleção, arquivo atual e arquivos escolhidos | P0 | Permissões | Prévia dos conteúdos enviados; nada implícito |
| FR-05 | Copiar prompt com um clique e instruções de uso | P0 | Clipboard API | Filtros e prévia reduzem risco de envio de segredos; usuário aprova o conteúdo |
| FR-06 | Importar resposta/patch por colagem explícita | P0 | Parser | Resposta inválida mostra erro; nunca grava arquivo |
| FR-07 | Preview de diff e aplicar/rejeitar mudanças | P0 | WorkspaceEdit | Só altera arquivos existentes/novos autorizados após confirmação |
| FR-08 | Chat local com histórico da sessão **sem credenciais** | P0 | Storage local | Histórico pode ser limpo; política de retenção explícita |
| FR-08b | Termo de ciência e responsabilidade (*First-run Disclaimer*) | P0 | UI / Storage local | Exibir aviso explícito na primeira execução informando o caráter experimental e o uso por conta e risco; exige confirmação do usuário antes de habilitar ações externas |
| FR-09 | Estados visíveis de provedor (`Web Assisted`, `Official API`, indisponível) | P0 | Interfaces de adapter | UI não confunde modo manual e automático |
| FR-10 | Cancelamento, feedback de erros e logs redigidos | P0 | Observabilidade | Sem stacktrace bruto ou token nos logs de usuário |
| FR-11 | Theming claro/escuro, teclado e acessibilidade | P0 | VS Code Webview | Navegável por teclado; contraste adequado |
| FR-12 | Provider oficial via chave configurada pelo usuário | P1 | POC-07 | Stream, timeout, cancelamento e erros testados |
| FR-13 | Planejamento e execução estruturada de ferramentas locais | P1 | G4 | Cada ação sensível depende de aprovação |
| FR-14 | Execução de testes/terminal com autorização | P1 | Workspace Trust + G4 | Comando exato exibido antes de executar |
| FR-15 | Fluxo de revisão multi-arquivos, checkpoints e rollback | P1 | Orquestrador | Mudanças reversíveis e testes de conflito |
| FR-16 | Indexação seletiva de workspace e exclusões | P1 | Privacidade | Segue `.gitignore` + regras adicionais |
| FR-17 | Integração web bidirecional de mensagens | P2 | **G3** | Mecanismo suportado/permitido e confiável demonstrado |
| FR-18 | Agent loop sobre interface web | P2 | **G3 + G4** | Resultados reproduzíveis, segura contra execução arbitrária |
| FR-19 | Backends adicionais / BYOK | P2 | Provider SDK | Pluggability sem alterar UX central |

### 9.1 UX e telas esperadas

**Painel Argonauta:**

- Aviso/modal de ciência e responsabilidade (*First-run Disclaimer*) na primeira inicialização, com link para as políticas e registro do aceite.
- Cabeçalho com **nome do modo ativo** e indicador de disponibilidade.
- Área de conversa/atividade (mensagens locais; no modo web assistido, **não** alegar que exibe transcrição sincronizada automaticamente).
- Input de prompt com botões `Add Context`, `Open Gemini`, `Copy Prompt`, `Import Response`.
- Lista de arquivos/trechos selecionados com remoção individual.
- Aba/área de **Diff Review** com botões `Apply`, `Reject`, e resumo das alterações.
- Seção `Settings` com provedor, exclusões, limites de contexto, logs e política de privacidade.

**Progressive disclosure:** fluxos de terminal e execução de ferramentas só aparecem quando o backend suportar essa capacidade e o workspace for confiável.

### 9.2 Fluxos prioritários

**Fluxo A — Perguntar sobre seleção (MVP):**

1. Na primeira execução, usuário visualiza e confirma ciência do termo de responsabilidade e uso por conta e risco.
2. Usuário seleciona código.
3. Executa `Argonauta: Ask About Selection`.
4. Confere a prévia de contexto, remove trechos sensíveis e aprova.
5. Extensão gera/copia prompt e abre/foca Gemini Web conforme capacidade do host.
6. Usuário envia a mensagem pela interface web.
7. Usuário traz a resposta para o Argonauta por colagem/importação.
8. Se houver patch, visualiza diff e decide aplicar/rejeitar.

**Fluxo B — Agente com API oficial (pós-MVP):**

1. Usuário configura sua própria credencial de provedor suportado.
2. Extensão executa a solicitação via API documentada.
3. Modelo propõe chamadas de ferramentas estruturadas.
4. Orquestrador valida caminho, escopo e permissões.
5. Usuário aprova ações sensíveis e revisa diffs.
6. Extensão aplica mudanças e apresenta resultados/testes.

**Fluxo C — Web avançado (somente após G3/G4):** definir depois que um canal suportado estiver comprovado. Não estimar nem anunciar capacidade antes disso.

## 10. Arquitetura técnica proposta

### 10.1 Stack inicial

**Todas as tarefas de programação, depuração e validação do mantenedor ocorrerão dentro do Antigravity IDE.** `@types/vscode` e ferramentas do ecossistema VS Code podem ser usados como bibliotecas/SDKs; isso não implica utilizar o aplicativo VS Code.

- **TypeScript + Node.js** para Extension Host.
- **API de extensões compatível com VS Code, conforme disponibilizada pelo Antigravity IDE**, para comandos, seleção, arquivos, edições, terminal e storage. Testar cada capacidade no host real.
- **WebviewView** ou **WebviewPanel** para UI própria com CSP restritiva.
- **Bundler:** `esbuild` inicialmente, com testes em CI.
- **Testes:** unitários em Vitest (se compatível com o ambiente escolhido); integração executada **no Antigravity IDE**, com harness adaptado à sua implementação. O harness oficial do VS Code poderá servir de referência, mas não comprova execução no Antigravity.
- **Versão mínima da API:** definir após inventário dos hosts; **não inventar compatibilidade**.
- **Sem servidor próprio no MVP.** Nenhuma telemetria por padrão.

### 10.2 Componentes

```text
┌──────────────────────────────────────────────────────────┐
│           Antigravity IDE (host principal)               │
│  Command Palette · Editor · Workspace · Terminal        │
└────────────────────────┬─────────────────────────────────┘
                         │ VS Code API
┌────────────────────────▼─────────────────────────────────┐
│ Argonauta Extension Host                                 │
│  ├─ HostCompatibility                                    │
│  ├─ ContextCollector + PrivacyFilter                     │
│  ├─ SessionStore                                         │
│  ├─ PromptComposer                                       │
│  ├─ PatchParser + DiffReviewer + WorkspaceEdit           │
│  ├─ PermissionGate / ToolOrchestrator                     │
│  └─ ProviderRegistry                                     │
│       ├─ WebAssistedAdapter (abrir/copiar/importar)       │
│       ├─ OfficialApiAdapter (posterior)                  │
│       └─ WebBridgeAdapter (somente se G3 aprovado)       │
└────────────────────────┬─────────────────────────────────┘
                         │ mensagens internas validadas
┌────────────────────────▼─────────────────────────────────┐
│ Argonauta UI (Webview própria; não é Gemini embutido)    │
│  Chat/Activity · Context · Provider · Diff · Settings    │
└──────────────────────────────────────────────────────────┘

Separadamente: Gemini Web em navegador integrado/externo, sujeito
à autenticação normal, compatibilidade do host e termos aplicáveis.
```

### 10.3 Contrato de provedor (modelo conceitual)

```ts
interface ProviderCapabilities {
  openWebPage: boolean;
  promptHandoff: boolean;
  responseStreaming: boolean;
  toolCalling: boolean;
  fileContext: boolean;
}

interface ProviderAdapter {
  readonly id: string;
  getCapabilities(): ProviderCapabilities;
  getStatus(): Promise<'ready' | 'needs-setup' | 'unavailable'>;
  // Métodos adicionais só serão definidos para capacidades reais.
}
```

**Regra:** o modo `WebAssistedAdapter` não implementa streaming/tool calling simulados. A UI usa capacidades para habilitar/desabilitar opções, em vez de assumir que todos os provedores são agentes.

### 10.4 Estrutura inicial sugerida do repositório

```text
argonauta/
├── README.md                  # inglês; instalação + capacidades/limitações reais
├── AGENTS.md
├── package.json
├── LICENSE                    # escolher antes de publicar
├── apps/
│   ├── ide-extension/
│   ├── chrome-extension/
│   └── native-host/
├── packages/
│   ├── protocol/
│   └── ipc/
├── tools/
│   ├── compatibility-probe/
│   └── native-messaging-smoke/
├── tests/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── product/
│   └── validation/
├── scripts/
│   └── windows/
└── .github/
    ├── workflows/
    └── ISSUE_TEMPLATE/
```

**Nota:** pastas podem ser criadas incrementalmente; não construir toda a infraestrutura antes de validar os gates.

## 11. Requisitos não funcionais

### 11.1 Segurança

- Respeitar `vscode.workspace.isTrusted` e *Restricted Mode*; apenas leitura segura, se suportada, fora de workspaces confiáveis.
- Validar caminhos relativos/absolutos e symlinks; bloquear escrita fora das raízes aprovadas.
- Não executar scripts recebidos de respostas ou arquivos do projeto sem confirmação.
- Proteger contra *prompt injection*: conteúdo dos arquivos é **dado não confiável**, nunca instrução privilegiada para execução.
- Prévia explícita antes de enviar conteúdo para qualquer IA; excluir `.env`, chaves privadas, arquivos de credenciais e padrões customizados por padrão, com controles documentados.
- Exigir aprovação para alterações, criação/exclusão de arquivos, comandos de terminal e acessos externos sensíveis.
- Política de **zero coleta de senhas, cookies de sessão e tokens de login do Google**.
- Chaves de API fornecidas pelo usuário, quando existirem, guardadas em `SecretStorage`, nunca no `settings.json` nem em logs.
- CSP estrita em Webviews; mensagens tipadas/validadas; proibir scripts remotos desnecessários.
- Não abrir portas locais nem serviços de escuta no MVP; se um componente futuro precisar disso, documentar ameaça, autorização, escopo e autenticação.

### 11.2 Privacidade

- Sem telemetria, analytics ou envio para servidor próprio por padrão.
- Dados do workspace não enviados automaticamente. Mostrar origem e tamanho do contexto.
- Histórico local opcional, com opção `Clear All Sessions` e retenção documentada.
- Mensagens enviadas ao Gemini Web/API estão sujeitas às políticas desses serviços, explicadas na documentação.
- Nenhum código-fonte privado coletado em relatórios de erros ou issues sem consentimento explícito.

### 11.3 Performance e confiabilidade

- Extensão com inicialização sob demanda, evitando atrasar a abertura da IDE.
- Operações de leitura e parsing canceláveis, com limites configuráveis de tamanho e contagem de arquivos.
- UI responsiva durante operações longas.
- Erros operacionais compreensíveis: `Browser unsupported`, `Login unavailable`, `Provider not configured`, `Invalid patch`, `Workspace not trusted`.
- Nenhuma escrita parcial silenciosa: agrupar edições quando possível e oferecer recuperação/rollback.

### 11.4 Acessibilidade e internacionalização

- Navegação por teclado, rótulos acessíveis e suporte a alto contraste.
- Textos de UI em inglês por padrão; externalizar strings para futura tradução PT-BR.
- Documentação principal em inglês para alcance internacional; guias PT-BR opcionais.

## 12. Critérios de aceite do MVP (Definition of Done)

- [ ] Extensão inicia **no Antigravity IDE suportado**, sem erros no console.
- [ ] Host e capacidades detectados sem dependência obrigatória de comandos internos não documentados.
- [ ] `Argonauta: Open` abre painel próprio.
- [ ] `Argonauta: Ask About Selection` mostra seleção e metadados antes de compartilhar.
- [ ] Usuário pode excluir trechos/arquivos do prompt e copiar somente conteúdo aprovado.
- [ ] O Gemini abre em navegador suportado (integrado ou externo) sem manipular credenciais.
- [ ] Usuário pode colar/importar uma resposta e revisar um patch.
- [ ] Não há aplicação de edições sem aceite específico.
- [ ] Tentativas de escrita fora do workspace são recusadas.
- [ ] Arquivos sensíveis são excluídos por padrão e documentados.
- [ ] Comportamento em workspace não confiável é seguro e explícito.
- [ ] Modo `Web Assisted` identificado na UI, README e descrição da loja.
- [ ] Termo de uso por conta e risco (*First-run Disclaimer*) implementado na primeira execução, exigindo confirmação explícita antes de liberar integrações externas.
- [ ] Avisos de isenção de responsabilidade (*disclaimer*) destacados no `README.md`, `SECURITY.md` e na documentação de lançamento.
- [ ] Testes unitários, lint, empacotamento VSIX e checagens de segurança aprovados.
- [ ] `README`, `SECURITY`, licença, matriz de suporte e changelog revisados.
- [ ] Validação manual documentada **no Antigravity IDE**. VS Code só entra na lista de suporte **quando efetivamente testado**; não é requisito do MVP.

**MVP não exige automação do Gemini Web.** Ela é objetivo de pesquisa de alto risco, não critério de aceite do primeiro release.

## 13. Testes e estratégia de qualidade

### 13.1 Testes automatizados

- Unitários: `PromptComposer`, filtro de segredos, normalização de caminhos, parser de patches, política de permissões, contratos de provider.
- Integração: seleção do editor → contexto → prompt; patch → `WorkspaceEdit` → comparação de conteúdo.
- Segurança: tentativa de path traversal (`../`), symlink fora da pasta, instruções maliciosas em arquivo, comando sem confirmação, vazamento acidental em log.
- Regressão: troca de provedor, cancelamento, recuperação após reiniciar e conteúdo Unicode/PT-BR.

### 13.2 Matriz manual

| Ambiente | POC navegador/login | MVP funcional | Publicação |
|---|---|---|---|
| **Antigravity IDE / Windows** | **Obrigatório / primeiro** | **Obrigatório / primeiro** | **Open VSX após validação** |
| Antigravity IDE / Linux ou macOS | Desejável | Beta, se testado | Posterior |
| VS Code Stable / Windows | Opcional durante MVP | Somente após homologação | Visual Studio Marketplace depois |
| VS Code Stable / Linux ou macOS | Posterior | Não presumir | Futuro |
| Outras IDEs compatíveis | Sob demanda | Não presumir | Futuro |

### 13.3 Checklist de evidência

- Cada teste inclui data, versão da IDE, sistema, versão da extensão, reproduções e resultado.
- Capturas ocultam e-mails, fotos de perfil, IDs, credenciais e projetos privados.
- Falhas e limitações são publicadas no README, sem omissões na apresentação pública.

## 14. Backlog e marcos

### M0 — Foundation / Discovery (primeiro)

- [ ] Confirmar disponibilidade de nome e namespace.
- [ ] Criar repositório Git e branch principal.
- [x] Manter este documento como `PRD.md` na raiz do projeto.
- [ ] Definir licença e regras de contribuição.
- [ ] Executar POC-01 a POC-05 com relatório reproduzível.
- [ ] Decidir G1 e G3 **antes** de qualquer promessa sobre automação web.

**Entrega:** relatório de viabilidade e escopo de implementação atualizado.

### M1 — Web Assisted Prototype

- [ ] Gerar extensão TypeScript mínima.
- [ ] Implementar comandos, painel e fallback de navegador.
- [ ] ContextCollector/PromptComposer com consentimento.
- [ ] Copiar prompt, importar resposta e preview de diff.
- [ ] Testes unitários e integração básicos.

**Entrega:** VSIX local utilizável e demonstração gravada de fluxo real.

### M2 — Beta open source

- [ ] UI refinada, acessível e com suporte a tema.
- [ ] Guardrails e revisão de segurança.
- [ ] Docs, issues, changelog, CI, screenshots e vídeo.
- [ ] Testes reais **no Antigravity IDE**; VS Code quando houver disponibilidade e for pertinente à expansão.
- [ ] Release GitHub pré-lançamento.

**Entrega:** beta público, claramente descrito como **Web Assisted**.

### M3 — Official API Agent (trilha paralela/opcional)

- [ ] Implementar provedor programático com chave própria e cobrança explicada.
- [ ] Streaming e tool-calling conforme documentação do provedor.
- [ ] Aprovações de terminal, arquivos e rede.
- [ ] Testes de prompt injection e checkpoints.

**Entrega:** modo agente com backend oficialmente suportado.

### M4 — Web Bridge (estritamente condicionado)

- [ ] Aprovar G3 técnica e contratualmente.
- [ ] Especificar interfaces públicas e mecanismo de consentimento.
- [ ] Implementar integração bidirecional sem extração de sessões/endpoints privados.
- [ ] Homologar confiabilidade e falhas de login/layout.

**Entrega:** somente se viável; caso contrário, encerrar esta trilha e documentar a decisão.

### M5 — Publicação e comunidade

- [ ] Definir publisher e garantir titularidade do namespace.
- [ ] Revisar nome/ícones/descritivos para evitar confusão de marca.
- [ ] Empacotar **um VSIX reprodutível**.
- [ ] Publicar no **Open VSX**, após requisitos e testes do host compatível.
- [ ] Publicar separadamente no **Visual Studio Marketplace**, **somente depois** de validar suporte real a VS Code; não condicionar o lançamento no Open VSX a essa etapa.
- [ ] README e release notes em inglês com tabela de capacidades reais.
- [ ] Divulgar demo no GitHub/X/Reddit/Hacker News respeitando as regras das comunidades.

**Nota:** publicação em uma loja **não** implica publicação automática na outra; cada registro exige preparação própria.

## 15. Critérios para lançamento público e comunicação

### Mensagens permitidas se comprovadas

- “Argonauta helps you bring selected code context to Gemini Web from Antigravity IDE.”
- “Review and apply generated patches from your IDE.”
- “Works with the Gemini Web session you access in your own browser” (somente após validar o fluxo específico).

### Mensagens que exigem evidência adicional

- “Full autonomous Gemini 4 Argon agent with Google AI Pro.”
- “No API needed for automated tool calling.”
- “Works in every VS Code-compatible IDE.”
- “Unlimited Argon access.”

Essas promessas **não devem ser usadas** sem documentação técnica reproduzível, confirmação de acesso e avaliação de conformidade.

### Estratégia de divulgação

1. **Prova antes de anúncio:** vídeo curto e sem cortes, com a IDE, contexto selecionado, acesso real ao provedor e aplicação revisada de patch.
2. **Post técnico:** explicar diferenças entre Gemini Web, IDE e API — sem vender um bypass.
3. **Código e benchmarks reprodutíveis:** GitHub público, testes automatizados, changelog e limitações explícitas.
4. **Feedback estruturado:** GitHub Discussions e issues com templates de versão do host/SO/resultado.
5. **Contribuições externas:** documentação em inglês, `good first issue`, política de vulnerabilidades e roadmap público.

## 16. Riscos e mitigação

| Risco | Probabilidade / impacto (estimativa) | Mitigação |
|---|---|---|
| Login Google bloqueado no navegador integrado | Médio / Alto | Testar primeiro; fallback externo |
| API de navegador só disponível a agentes nativos | Alto / Alto | Verificar APIs públicas; não depender de comandos internos |
| Restrições contratuais à automação do Gemini Web | Incerta / Crítico | Revisão antes de G3; não contornar restrições; trilha manual/API oficial |
| Modelo Argon removido ou liberado a Pro na IDE | Alto dinamismo / Médio | Proposta de valor não depender de um modelo/episódio |
| Exposição de código ou segredos | Médio / Crítico | Consentimento, exclusões, filtros, testes e política de privacidade |
| Prompt injection / comando malicioso | Médio / Crítico | Separação dados-instruções e aprovação explícita |
| Rejeição por uso de marca ou marketplace | Médio / Alto | Branding independente e revisão de termos |
| Fragmentação entre VS Code e Antigravity | Médio / Alto | Compatibility layer e testes por host |
| Promessas maiores que o MVP | Alto / Alto | Mensagem precisa e roadmap público |
| Dependência de interface web que muda | Alto / Alto | Evitar DOM scraping; adapters e fallback |
| Sanções ou suspensão de conta de terceiros por uso indevido ou automação não tolerada | Baixo no modo assistido manual / Médio se houver automação | Uso estritamente por conta e risco do usuário; disclaimer obrigatório na UI/docs; recusa de scrapers/bypass no MVP |

## 17. Decisões abertas (ADR backlog)

| ID | Decisão | Proposta atual | Momento |
|---|---|---|---|
| ADR-001 | Licença | MIT ou Apache-2.0, a decidir | Antes do commit público inicial |
| ADR-002 | Publisher ID | A definir pelo mantenedor | Antes da publicação |
| ADR-003 | Versão/API mínima do host Antigravity IDE | Definir pela matriz de compatibilidade | Após POC-01 |
| ADR-004 | Tecnologia de UI | Webview simples primeiro, framework se necessário | Após POC-05 |
| ADR-005 | Navegador integrado versus externo | Seleção de modo baseada em recursos verificados | Após POC-02/04 |
| ADR-006 | Política de importação de patch | Unified diff, com parser restritivo e preview | Durante M1 |
| ADR-007 | Armazenamento de histórico | Local e opcional, exclusão simples | Durante M1 |
| ADR-008 | Backends oficiais | Priorizar uso com chave própria e custos transparentes | Durante M3 |
| ADR-009 | Web Bridge | Não implementar antes de G3 | Após testes e revisão de termos |

## 18. Próxima ação objetiva

**Com o repositório em evolução:**

1. Manter este documento como `PRD.md` na raiz do projeto.
2. Não desenvolver um bridge para Gemini Web ainda.
3. Preparar `docs/validation/compatibility-matrix.md`.
4. Abrir **somente o Antigravity IDE** e registrar sua versão e o sistema operacional.
5. Executar primeiro **POC-01**: verificar se a paleta de comandos oferece um navegador integrado e identificar seu nome exato (se existir).
6. Se existir, executar **POC-02/03**: abrir `https://gemini.google.com/app`, testar o login e verificar a seleção do Argon. Se não existir, registrar `unsupported` e avaliar fluxo assistido com navegador externo.
7. Trazer os resultados para escolher o próximo passo técnico. **Não é necessário instalar VS Code para desenvolver o Argonauta.**

## 19. Fontes oficiais consultadas (baseline em 14/10/2026)

> Links de referência para implementação; revalidar antes do release, pois produtos e termos podem mudar.

1. [VS Code — Integrated Browser](https://code.visualstudio.com/docs/debugtest/integrated-browser): navegação, sessões, permissões e ferramentas de agentes.
2. [VS Code — Webview API](https://code.visualstudio.com/api/extension-guides/webview): painéis, mensagens, isolamento e segurança.
3. [VS Code — Workspace Trust](https://code.visualstudio.com/api/extension-guides/workspace-trust): compatibilidade com workspaces não confiáveis.
4. [VS Code — Language Model Chat Provider API](https://code.visualstudio.com/api/extension-guides/ai/language-model-chat-provider): provedores com modelos e respostas programáticas.
5. [VS Code — Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension): VSIX, publisher e Visual Studio Marketplace.
6. [Eclipse Open VSX — Publishing Extensions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions): namespace e publicação no Open VSX.
7. [Gemini API — Billing](https://ai.google.dev/gemini-api/docs/billing): cobrança e limites da API, distintos de uma assinatura Gemini Web.
8. [Google — Terms of Service](https://policies.google.com/terms): condições de utilização, inclusive para acesso automatizado e engenharia reversa.
9. [Google — Gemini Apps Privacy Hub](https://support.google.com/gemini/answer/13594961?hl=pt-BR): tratamento de conteúdos compartilhados no Gemini.

---

**Critério decisivo do projeto:** Argonauta só poderá ser apresentado como um agente Gemini Web integrado à IDE quando houver uma integração **real, reproduzível, segura e permitida**. Até lá, a promessa pública deve corresponder exatamente ao que foi implementado.
