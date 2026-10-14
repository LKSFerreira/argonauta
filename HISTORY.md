# Histórico

## 2026-10-14 — Inicialização de discovery

- Repositório alinhado ao PRD do Argonauta.
- Stack planejada registrada como TypeScript com Node.js 20+.
- Criados o plano de discovery e a matriz de compatibilidade para os POCs iniciais.
- Nenhuma dependência, integração com Gemini Web ou automação de navegador foi adicionada.

## 2026-10-14 — Primeiro marco técnico: validação da POC-05A

- Aprovada em teste real a POC-05A de comunicação local via Chrome Native Messaging.
- O Google Chrome iniciou o processo Node.js nativo (`com.argonauta.poc05a`) e recebeu resposta PONG válida no popup da extensão Manifest V3.
- Contrato validado com 13/13 testes automatizados, protocolo `1.0`, host `0.1.0` e ID fixado `kmhnfligldbfbjmdmodckpmbnfmehfba`.
- Ajustada a matriz de compatibilidade para tratar restrições de Webview no Jetski Preview como hipótese provável, sem confirmação categórica de causa única.
- Definida a próxima etapa técnica: POC-05B para comunicação de ponta a ponta (Antigravity IDE ↔ Chrome via IPC local).

## 2026-10-14 — Migração para monorepo TypeScript

- Reorganizados aplicações futuras, pacotes reutilizáveis, ferramentas, testes, documentação e scripts em limites explícitos.
- Promovidos os contratos congelados da POC-05B para `packages/protocol`, sem alterar o protocolo `1.0` nem as fixtures PING/PONG.
- Mantidos os protótipos validados como `tools/compatibility-probe` e `tools/native-messaging-smoke`, sem promovê-los prematuramente a aplicações.
- Adotados npm workspaces para declarar dependências por projeto e executar a linha de base completa pela raiz.
- Registrada a decisão arquitetural em `docs/architecture/decisions/0001-monorepo-architecture.md`.
- Preservada a exigência de reinstalação manual do Native Messaging Host após a mudança do caminho absoluto do manifesto.
