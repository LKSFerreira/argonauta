# Testes manuais

Este diretório reúne validações que dependem de interação com aplicações reais e, por isso, não são substituídas pelos testes automatizados nem pelo CI.

## Roteiros disponíveis

| Roteiro | Finalidade | Estado após a migração |
|---|---|---|
| [01 — Chrome Native Messaging](01_chrome-native-messaging.md) | Confirmar o fluxo Chrome → Native Host → Chrome e a resposta PONG. | `pass` em 14/10/2026 |
| [02 — Antigravity IDE](02_antigravity-compatibility.md) | Confirmar o carregamento da extensão e as APIs públicas necessárias. | `pass` em 14/10/2026 |
| [03 — Toolchain Win32](03_win32-toolchain-installation.md) | Confirmar MSVC C++, Windows SDK e compilação nativa segura no host. | `pass` em 14/10/2026 |
| [04 — Segurança de Named Pipe Win32](04_win32-named-pipe-security.md) | Validar DACL, SID de logon e fail-closed do helper diagnóstico nativo (POC-05B). | `pending_validation`: M01–M14 e M18–M19 locais em `pass`; M15–M17 pendentes |

## Regras para registrar evidências

- Use somente `pass`, `fail` ou `unsupported` para cada critério.
- Registre data, versões necessárias, resultado observado e mensagem de erro sanitizada.
- Não registre nome de usuário, caminhos pessoais, conteúdo do workspace, credenciais, tokens, cookies ou sessões.
- Um resultado automatizado não deve ser apresentado como evidência de interação manual.
- Em caso de falha, preserve os logs técnicos relevantes depois de remover dados pessoais.
