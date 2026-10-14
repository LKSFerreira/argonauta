# Matriz de compatibilidade

> Preencha esta matriz apenas com resultados reproduzidos em ambientes próprios ou autorizados. O status `unsupported` indica ausência de recurso ou API compatível; não é uma inferência sobre versões não testadas.

| Host | Versão do host | Sistema operacional | Data | Navegador integrado | Login Gemini Web | Argon disponível | Canal público extensão-navegador | Status | Evidências | Observações |
|---|---|---|---|---|---|---|---|---|---|---|
| Antigravity IDE | Baseline 2026.10 | Windows | 14/10/2026 | Parcial (Jetski Preview) | `fail` (403 / tela em branco) | `unsupported` no integrado | `pass` na POC-05A (Chrome ↔ Host local via Native Messaging) | `blocked` no integrado / `pass` na ponte Chrome local | `example.com`: OK; `youtube.com`: branco; `gemini.google.com/app`: branco/403; POC-05A: PONG recebido | Jetski Preview não suporta o Gemini Web (hipótese mais provável: restrições de Webview). Validado canal Chrome ↔ Host local na POC-05A. |
| VS Code Stable | Não testado | Windows | — | Não testado | Não testado | Não testado | Não testado | pending | — | Executar testes posteriores apenas para portabilidade. |

## Registro por POC

### POC-01 — Capacidade de carregamento web no Antigravity IDE (Jetski Preview)

- **ID do POC:** POC-01
- **Data:** 14/10/2026
- **Host e SO:** Antigravity IDE no Windows
- **Pré-condições:** Conexão à internet ativa; recurso Jetski Preview disponível no host.
- **Passos exatos:** Abrir a visualização interna Jetski Preview e navegar até `example.com`.
- **Resultado esperado:** A página carregar e renderizar normalmente dentro da IDE.
- **Resultado observado:** A página `example.com` carregou com sucesso, comprovando que o Jetski Preview possui conectividade externa funcional.
- **Decisão:** `pass`

---

### POC-02 — Execução do Gemini Web no Jetski Preview

- **ID do POC:** POC-02
- **Data:** 14/10/2026
- **Host e SO:** Antigravity IDE no Windows
- **Pré-condições:** POC-01 aprovada; conta Google com assinatura Google AI Pro.
- **Passos exatos:**
  1. Acessar `youtube.com` no Jetski Preview.
  2. Acessar `gemini.google.com` (apresentou erro HTTP 403 inicial).
  3. Acessar a URL canônica e exata `https://gemini.google.com/app`.
- **Resultado esperado:** Carregamento da interface do Gemini Web e exibição da tela de login oficial Google.
- **Resultado observado:**
  - `youtube.com`: Apresentou tela em branco.
  - `https://gemini.google.com/app`: Permaneceu em tela em branco após o erro 403 inicial. A hipótese mais plausível e provável é a existência de restrições em Webviews incorporadas (como políticas de `disallowed_useragent` e controles de segurança de autenticação do Google), embora a causa exata não tenha sido comprovada isoladamente pelo comportamento visual.
- **Impacto:** O navegador embutido (Jetski Preview) não suporta a execução da aplicação web do Gemini.
- **Decisão:** `blocked` / `fail` (no ambiente integrado).
- **Encaminhamento técnico (Pivot):** Em conformidade com os princípios do projeto, não serão empregados artifícios de evasão de User-Agent, extração de cookies ou injeção de scripts. Seguir para a validação da arquitetura alternativa: manter a experiência de desenvolvimento no Antigravity IDE integrando-se ao Google Chrome real via Native Messaging (`Argonauta Bridge`), onde a sessão Pro e o modelo Argon já funcionam legitimamente.

---

### POC-05A — Validação de canal local via Chrome Native Messaging

- **ID do POC:** POC-05A
- **Data:** 14/10/2026
- **Host e SO:** Windows / Google Chrome e Node.js
- **Pré-condições:** Extensão MV3 (`kmhnfligldbfbjmdmodckpmbnfmehfba`) carregada em modo de desenvolvedor; host nativo (`com.argonauta.poc05a`) registrado no Registro do Windows (`HKCU`).
- **Passos exatos:**
  1. Executar bateria de testes automatizados (`npm test`).
  2. Abrir o popup da extensão no Chrome e acionar **Test Connection**.
- **Resultado esperado:** Troca de mensagens PING/PONG via stdio com protocolo validado e sem erros de Native Messaging.
- **Resultado observado:**
  - Testes automatizados: 13/13 aprovados.
  - Teste de integração real no Chrome: popup exibiu `PONG recebido`, protocolo `1.0`, host `0.1.0`. Identificador fixado da extensão conferido (`kmhnfligldbfbjmdmodckpmbnfmehfba`).
- **Impacto:** Primeiro canal de comunicação operacional comprovado entre o navegador (Google Chrome) e um processo local Node.js.
- **Decisão:** `pass`
- **Limites e Próximos passos:** O host local ainda não está acoplado à extensão do Antigravity IDE e o teste não acessa nem comprova integração programática com o Gemini Web. Próxima missão: POC-05B para estabelecer comunicação ponta a ponta (Antigravity IDE ↔ Chrome via IPC local), considerando a duração e o ciclo de vida do processo Node.js iniciado por `sendNativeMessage()`.

## Limites de segurança

- Use apenas o fluxo normal de autenticação do provedor.
- Não capture credenciais, cookies, tokens, capturas com dados pessoais ou conteúdo de projetos privados.
- Não use scripts de injeção, endpoints privados ou automação que contorne controles da plataforma.
