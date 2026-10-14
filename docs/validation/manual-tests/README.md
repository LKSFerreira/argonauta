# Testes manuais

Este diretório reúne validações que dependem de interação com aplicações reais e, por isso, não são substituídas pelos testes automatizados nem pelo CI.

## Roteiros disponíveis

| Roteiro | Finalidade | Estado após a migração |
|---|---|---|
| [Chrome Native Messaging](chrome-native-messaging.md) | Confirmar o fluxo Chrome → Native Host → Chrome e a resposta PONG. | `pass` em 14/10/2026 |
| [Antigravity IDE](antigravity-compatibility.md) | Confirmar o carregamento da extensão e as APIs públicas necessárias. | `pass` em 14/10/2026 |

## Regras para registrar evidências

- Use somente `pass`, `fail` ou `unsupported` para cada critério.
- Registre data, versões necessárias, resultado observado e mensagem de erro sanitizada.
- Não registre nome de usuário, caminhos pessoais, conteúdo do workspace, credenciais, tokens, cookies ou sessões.
- Um resultado automatizado não deve ser apresentado como evidência de interação manual.
- Em caso de falha, preserve os logs técnicos relevantes depois de remover dados pessoais.
