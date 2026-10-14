# Roadmap

## Estado atual

**Fase:** M0 — Foundation / Discovery.

- [x] Registrar o PRD e estruturar a documentação inicial.
- [x] Definir TypeScript + Node.js 20+ como stack planejada da extensão.
- [x] Criar matriz de compatibilidade e plano de discovery.
- [ ] Confirmar disponibilidade de nome, namespace e publisher.
- [ ] Executar POC-01 a POC-05 com evidências anonimizadas.
- [ ] Decidir os Gates G1 e G3 antes de prometer automação web.

## Próxima entrega: relatório de viabilidade

**Objetivo:** documentar se o Gemini Web pode ser usado em navegador integrado de hosts compatíveis e se há qualquer canal público e permitido entre extensão e navegador.

**Critérios de aceite:**

- Matriz com host, versão, sistema operacional, data e resultado explícito.
- POC-02 e POC-03 registrados sem captura ou manipulação de credenciais.
- POC-04 marcado como `pass`, `fail` ou `unsupported`, sem presumir compatibilidade do Antigravity IDE.
- POC-05 contém decisão fundamentada por APIs públicas e termos aplicáveis.
- Falhas bloqueadoras documentadas; nenhuma automação por sessão, cookies ou endpoints privados é implementada.

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
