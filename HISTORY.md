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
