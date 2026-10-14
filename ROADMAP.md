# Roadmap

## Estado atual

**Fase:** M0 — Foundation / Discovery.

- [x] Registrar o PRD e estruturar a documentação inicial.
- [x] Definir TypeScript + Node.js 20+ como stack planejada da extensão.
- [x] Criar matriz de compatibilidade e plano de discovery.
- [x] Executar POC-01, POC-02 e POC-05A com evidências registradas.
- [ ] Executar POC-05B (comunicação de ponta a ponta Antigravity IDE ↔ Chrome via IPC local).
  - [x] Etapa 0: validar compatibilidade das APIs públicas no Antigravity IDE.
  - [x] Etapa 1: congelar contratos, fixtures binárias e regressões automatizadas.
  - [ ] Etapa 2: implementar e comprovar o transporte local autorizado.
- [ ] Confirmar disponibilidade de nome, namespace e publisher.
- [ ] Decidir os Gates G1 e G3 antes de prometer automação web.

## Próxima entrega: viabilidade de ponta a ponta (POC-05B)

**Objetivo:** demonstrar a comunicação integrada de ponta a ponta entre a extensão da IDE (Antigravity IDE), o processo auxiliar local Node.js e a extensão do Google Chrome via Native Messaging.

**Critérios de aceite:**

- Matriz com host, versão, sistema operacional, data e resultado explícito atualizados.
- POC-01 (Jetski Preview com conectividade básica), POC-02 (bloqueio do Gemini Web no integrado com hipótese provável de Webview) e POC-05A (PONG via Chrome Native Messaging) aprovadas e documentadas.
- POC-05B estabelece canal IPC local seguro entre o Antigravity IDE e o Native Messaging Host, considerando o ciclo de vida do processo.
- Nenhuma automação invasiva, extração de cookies ou acesso não autorizado a sessões web.

## Marcos posteriores

1. **M1 — Protótipo Web Assistido:** comandos, contexto aprovado, cópia de prompt, importação explícita de resposta e revisão de diff.
2. **M2 — Beta open source:** acessibilidade, guardrails, documentação, CI e validação real nos hosts anunciados.
3. **M3 — Agente via API oficial:** somente com credencial própria, custos transparentes e aprovações para ações sensíveis.
4. **M4 — Web Bridge:** somente após aprovação técnica e contratual do Gate G3.
5. **M5 — Publicação:** após licença, segurança, matriz de compatibilidade e requisitos dos marketplaces.

## Decisões em aberto

- Licença: MIT ou Apache-2.0.
- Publisher e namespace de distribuição.
- Versão mínima do VS Code, após POC-01.
- Uso de navegador integrado ou externo, conforme POC-02 e POC-04.
- Tecnologia de UI, após os resultados de discovery.
