# Modelo de ameaças

## Ativos protegidos

- Código e arquivos do workspace.
- Segredos armazenados pela IDE.
- Sessões, cookies e credenciais do navegador.
- Integridade do protocolo e das fixtures.
- Registro do Windows do usuário atual.

## Fronteiras de confiança

| Fronteira | Tratamento |
|---|---|
| Objeto recebido para serialização | Inspeção estrutural passiva antes de `JSON.stringify`. |
| Bytes recebidos | Framing incremental, tamanho, lote e UTF-8 estritos. |
| Extensão Chrome → host local | Origem exata, operação PING fechada e stdio. |
| Antigravity IDE → recursos seguros | Timeouts, cancelamento, limpeza e relatório sanitizado. |
| IDE → Windows Named Pipe | Gate bloqueado: DACL padrão e acesso remoto de `node:net` não atendem ao isolamento exigido. |
| Scripts Windows → Registro | Execução manual, confirmação textual e escopo `HKCU`. |

## Ameaças controladas

- Getters, setters, `toJSON`, proxies, funções e ciclos são rejeitados antes da serialização.
- Payloads dos contratos novos são limitados a 64 KiB.
- Lotes e fragmentos excessivos são rejeitados deterministicamente.
- Estruturas acima de 64 níveis não usam recursão da pilha.
- O manifesto Chrome usa somente `nativeMessaging` e uma origem exata.
- Nenhum componente escuta em TCP ou HTTP.
- Nenhuma mensagem do navegador é convertida em comando arbitrário.

## Riscos residuais

- A DACL do pipe temporário criado por `node:net` foi inspecionada e reprovada: `Everyone` e `Anonymous` possuem leitura, o SID de logon não aparece e `\\localhost\pipe` consegue conectar.
- Uma solução segura exige criação com descritor explícito e bloqueio remoto desde o primeiro handle; a alternativa técnica ainda depende de aprovação.
- O host da POC-05A depende do `node.exe` disponível no `PATH` herdado pelo Chrome.
- Uma instalação registrada deixa de funcionar quando o repositório é movido, até reinstalação manual.
- Testes automatizados não substituem a validação real no Antigravity IDE e no Chrome.

## Fora do escopo

Gemini Web, cookies, sessões Google e autenticação HMAC não são acessados ou implementados nesta etapa. O Named Pipe foi criado apenas de forma efêmera para o gate, sem mensagens funcionais ou processo residente.
