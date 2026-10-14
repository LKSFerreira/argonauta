# Plano técnico — POC-05B: Antigravity IDE ↔ Native Host ↔ Chrome

## 1. Objetivo

Planejar uma prova de conceito capaz de demonstrar comunicação bidirecional e estruturada entre:

1. uma extensão do Argonauta executada localmente no Antigravity IDE;
2. um Native Messaging Host Node.js;
3. uma extensão Google Chrome Manifest V3 controlada pelo projeto.

O teste deverá disponibilizar o comando **`Argonauta: Test Bridge`** no Antigravity IDE. Ao executá-lo, uma mensagem sairá da IDE, atravessará o componente local, chegará à extensão Chrome e retornará pelo mesmo caminho com o mesmo identificador de requisição.

Esta POC não acessará Gemini Web, páginas de terceiros, DOM, cookies, credenciais, tokens ou sessões. Também não executará comandos arbitrários nem abrirá servidores TCP, HTTP ou WebSocket.

## 2. Estado de entrada e limites da conclusão

### 2.1 Evidência herdada da POC-05A

A POC-05A foi validada no Windows em 14/10/2026:

- 13/13 testes automatizados aprovados;
- extensão Chrome Manifest V3 carregada com ID fixo;
- Native Messaging Host registrado manualmente em `HKCU`;
- PING/PONG real aprovado entre Chrome e Node.js;
- protocolo `1.0` e host `0.1.0` observados no popup.

A implementação e os testes da POC-05A serão tratados como baseline imutável durante a POC-05B. A nova prova de conceito deverá ficar em diretório próprio e executar a suíte da POC-05A como teste de regressão.

### 2.2 O que a POC-05B poderá comprovar

- que uma extensão local do Antigravity consegue usar APIs compatíveis com VS Code para registrar e executar um comando;
- que o Extension Host local permite IPC do Node.js;
- que IDE, processo local e extensão Chrome conseguem realizar uma ida e volta autenticada;
- que falhas e encerramentos são detectados sem deixar processos ou recursos órfãos.

### 2.3 O que a POC-05B não poderá comprovar

- acesso ou automação de uma aba do Gemini Web;
- leitura de conteúdo, DOM ou sessão de qualquer página;
- aprovação do Gate G3 para integração com serviços web de terceiros;
- compatibilidade automática com todas as versões do Antigravity ou do VS Code;
- prontidão da arquitetura para produção.

## 3. Evidências sobre o Antigravity IDE

### 3.1 Evidência oficial

A documentação pública do Antigravity descreve o produto e suas extensões oficiais, mas não foi localizada uma especificação pública separada para desenvolvimento de extensões de terceiros no Antigravity IDE. Portanto, APIs exclusivas ou comandos internos do Antigravity não serão usados como contrato arquitetural.

### 3.2 Evidência local em 14/10/2026

A instalação usada neste projeto apresentou:

| Evidência | Valor observado |
|---|---|
| Produto | Antigravity IDE 2.5.5 |
| Base do editor | `1.107.0` |
| Runtime declarado | Node.js `22.20.0` |
| Extension Host | processo Node.js presente na distribuição |
| Catálogo de extensões | Open VSX configurado |
| Ambiente atual | variáveis `VSCODE_PID` e `VSCODE_CWD` disponíveis |

Esses dados são fortes indícios de compatibilidade com a arquitetura de extensões do VS Code, mas ainda são uma inferência. A primeira etapa da POC-05B deve validar, dentro do Antigravity, somente as APIs públicas necessárias:

- `vscode.commands.registerCommand`;
- `vscode.window.withProgress`;
- `vscode.window.showInformationMessage` e `showErrorMessage`;
- `ExtensionContext.secrets` e `globalStorageUri`;
- runtime Node.js local com acesso a `node:net` e `node:crypto`;
- `extensionKind: ["ui"]` para preferir execução na máquina local.

Se qualquer uma dessas capacidades não estiver disponível, o resultado deve ser registrado como `unsupported` ou `blocked`. Não será usado `executeCommand` interno, API proposta ou engenharia reversa para contornar o bloqueio.

## 4. Arquitetura recomendada

```text
┌───────────────────────────────────────────────────────────────┐
│ Antigravity IDE                                               │
│                                                               │
│  Comando: Argonauta: Test Bridge                              │
│  Extensão Argonauta executada no Extension Host local Node.js │
└──────────────────────────────┬────────────────────────────────┘
                               │ Windows Named Pipe
                               │ canal duplex + autenticação
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Native Messaging Host / Bridge Node.js                        │
│                                                               │
│  Validação de origem Chrome                                   │
│  Servidor Named Pipe local                                    │
│  Autenticação e roteamento por idRequisicao                   │
│  Lista fechada de tipos; nenhuma execução arbitrária          │
└──────────────────────────────┬────────────────────────────────┘
                               │ Chrome Native Messaging
                               │ porta persistente connectNative()
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Extensão Chrome Manifest V3                                   │
│                                                               │
│  Service worker próprio                                      │
│  Somente permissão nativeMessaging                            │
│  Responde ao teste sem acessar abas ou páginas                │
└───────────────────────────────────────────────────────────────┘
```

### 4.1 Responsabilidades

#### Extensão do Antigravity

- registrar o comando `Argonauta: Test Bridge`;
- verificar se está executando em Extension Host Node.js local;
- ler a configuração local da ponte e autenticar-se no Named Pipe;
- enviar uma única solicitação de teste com timeout;
- validar correlação, versão e resposta;
- apresentar sucesso ou erro em pt-BR, sem expor segredos ou stack traces;
- fechar o socket após a resposta.

#### Native Messaging Host

- continuar validando a origem exata da extensão Chrome;
- manter `stdout` reservado ao framing oficial do Native Messaging;
- iniciar o Named Pipe somente após a origem Chrome ser aceita;
- autenticar o cliente da IDE antes de aceitar mensagens funcionais;
- validar schemas, tamanhos, versões, sequência e identificadores;
- rotear somente tipos explicitamente permitidos;
- correlacionar solicitações pendentes e aplicar timeout;
- encerrar o pipe quando a conexão nativa do Chrome terminar.

#### Extensão Chrome

- manter uma porta com o host por `chrome.runtime.connectNative()`;
- receber somente mensagens do contrato da POC;
- responder ao teste com o mesmo `idRequisicao`;
- não declarar `content_scripts`, `host_permissions`, `tabs`, `cookies` ou permissões de rede;
- aplicar reconexão limitada após queda do host, sem loop infinito de reinicialização.

## 5. Decisão de IPC local

### 5.1 Alternativas avaliadas

| Alternativa | Vantagens | Riscos e limitações | Decisão |
|---|---|---|---|
| **Windows Named Pipe** | Duplex, baixa latência, suportado por `node:net`, sem porta TCP, adequado a processos independentes | Exige autenticação, framing e verificação efetiva de ACL; escopo inicial apenas Windows | **Recomendado para a POC-05B** |
| Stdio de processo filho | Simples, privado e fácil de testar | IDE e Chrome não conseguem ser proprietários do mesmo `stdin/stdout`; Chrome já reserva stdio para Native Messaging | Rejeitado como ligação IDE ↔ host |
| TCP ou WebSocket em `127.0.0.1` | Simples, multiplataforma e bem suportado | Abre porta, amplia superfície de ataque e contraria a preferência do PRD por ausência de servidor local | Rejeitado nesta POC |
| Arquivo local com polling | Não abre porta e é simples de inspecionar | Persistência desnecessária, condições de corrida, latência e risco de deixar mensagens ou segredos em disco | Rejeitado |
| MCP local | Suportado pelo ecossistema Antigravity e útil para ferramentas de agentes | Resolve integração agente-ferramenta, não o transporte de uma extensão de UI até uma extensão Chrome; aumenta o escopo | Fora do escopo |
| COM, RPC ou serviço Windows | Controles nativos avançados | Complexidade, instalação e privilégios desproporcionais para a POC | Rejeitado |

Em uma futura expansão para Linux ou macOS, a abstração de transporte poderá usar Unix Domain Sockets. A POC-05B deve manter uma interface de transporte independente de `node:net`, mas implementar apenas Windows Named Pipes.

### 5.2 Nome e escopo do pipe

Nome proposto:

```text
\\.\pipe\LOCAL\argonauta-poc05b-<idInstalacao>
```

O `idInstalacao` deve ser aleatório e persistido na configuração local, sem conter nome de usuário, caminho de workspace ou outro dado pessoal.

Os padrões `readableAll` e `writableAll` devem permanecer desativados. Antes da aprovação técnica da implementação, deve ser comprovado que a DACL efetiva permite somente o usuário/logon atual e bloqueia acesso remoto. A documentação da Microsoft informa que descritores padrão de Named Pipes podem conceder direitos mais amplos que o desejado; por isso, o nome aleatório e o segredo de sessão são defesa adicional, não substitutos da ACL.

Se a API `node:net` do runtime do Antigravity/host não permitir produzir e verificar o isolamento exigido, a implementação deverá parar nesse gate e avaliar um helper local mínimo que crie o pipe com descritor de segurança explícito. Não se deve aceitar TCP como fallback silencioso.

## 6. Ciclo de vida do Native Messaging Host

### 6.1 `sendNativeMessage()`

Na POC-05A, `sendNativeMessage()` é adequado porque:

- inicia um processo para uma solicitação isolada;
- considera somente a primeira resposta do host;
- encerra o caso de uso depois do PING/PONG.

Esse modelo não atende à POC-05B. Uma mensagem iniciada pela IDE pode chegar ao host depois que a solicitação original do Chrome terminou, e respostas adicionais seriam ignoradas.

### 6.2 `connectNative()`

A POC-05B deve usar `chrome.runtime.connectNative()` em um service worker Manifest V3 porque:

- cria uma porta duplex persistente;
- mantém o mesmo processo do Native Messaging Host enquanto a porta existir;
- permite que o host envie mensagens ao Chrome fora do callback de uma requisição única;
- mantém o service worker ativo nas versões modernas do Chrome enquanto a conexão nativa estiver aberta.

### 6.3 Sequência de inicialização

1. O usuário aciona manualmente **Conectar ponte** na extensão Chrome.
2. O service worker chama `connectNative()`.
3. Chrome valida o manifesto e inicia o host `com.argonauta.poc05b`.
4. O host valida a origem Chrome recebida na linha de comando.
5. O host inicia o Named Pipe e informa `HOST_PRONTO` ao Chrome.
6. O comando no Antigravity conecta-se ao pipe e autentica a sessão.
7. A IDE executa o teste ponta a ponta.

Se a extensão Chrome não estiver conectada, o comando da IDE deve retornar `CHROME_DESCONECTADO` com orientação objetiva. A extensão do Antigravity não deve iniciar o Chrome nem alterar o Registro.

### 6.4 Reconexão e encerramento

- A primeira conexão será sempre manual para facilitar a depuração. Uma reconexão automática posterior só poderá ser adicionada após aprovação específica.
- Se aprovada em etapa posterior, a reconexão poderá usar atrasos crescentes, por exemplo `1 s`, `2 s`, `5 s`, `10 s` e `30 s`.
- Após cinco falhas consecutivas, novas tentativas automáticas devem parar até uma ação do usuário ou novo evento de inicialização.
- EOF ou erro em `stdin` significa que o Chrome encerrou a conexão nativa.
- Ao perder o Chrome, o host deve rejeitar solicitações pendentes, enviar `CHROME_DESCONECTADO` aos clientes autenticados, fechar sockets e encerrar.
- Ao desativar a extensão do Antigravity, sockets, timers e listeners devem ser descartados.
- O pipe desaparece com o processo; não deve haver arquivo de socket residual.
- Nenhum processo deve ser morto por busca ampla de nome. Apenas handles e PIDs iniciados ou observados pela própria sessão podem ser encerrados.

## 7. Autenticação e autorização

### 7.1 Fronteiras de confiança

| Fronteira | Controle principal |
|---|---|
| Chrome → Native Host | `allowed_origins` exato, chave fixa da extensão e validação do argumento de origem pelo host |
| Antigravity → Named Pipe | DACL do usuário/logon atual + segredo aleatório de 256 bits + challenge-response |
| Host → Chrome | Porta criada pelo Chrome e contrato fechado de mensagens |
| Mensagens funcionais | Schema estrito, tamanho máximo, versão e lista de tipos permitidos |

### 7.2 Provisionamento

Um script separado e executado manualmente deverá:

1. exibir todos os caminhos e chaves que pretende criar;
2. exigir confirmação textual explícita;
3. gerar `idInstalacao` e segredo com fonte criptográfica;
4. gravar a configuração em `%LOCALAPPDATA%\Argonauta\POC-05B\bridge-config.json`;
5. restringir a ACL ao usuário/logon atual;
6. registrar `com.argonauta.poc05b` em `HKCU` somente após autorização;
7. nunca imprimir o segredo em logs.

A extensão do Antigravity lerá a configuração somente para importar o segredo em `ExtensionContext.secrets`. O host continuará lendo a cópia protegida por ACL. A POC deve declarar explicitamente que não protege contra comprometimento completo da conta Windows atual.

### 7.3 Handshake proposto

O host inicia o handshake com um desafio imprevisível gerado por fonte criptográfica. A autenticação usará um transcript canônico, com ordem e codificação de campos definidas antes da Etapa 3, para impedir ambiguidades de serialização.

Primeira mensagem do host:

```json
{
  "tipo": "DESAFIO_AUTENTICACAO",
  "idRequisicao": "uuid",
  "versaoProtocolo": "1.0",
  "nonceHost": "base64url imprevisível",
  "instanteHost": "2026-10-14T12:00:00.000Z"
}
```

Resposta da IDE:

```json
{
  "tipo": "AUTENTICAR",
  "idRequisicao": "mesmo uuid",
  "versaoProtocolo": "1.0",
  "idInstalacao": "identificador aleatório",
  "nonceHost": "mesmo desafio recebido",
  "nonceCliente": "base64url imprevisível",
  "instanteCliente": "2026-10-14T12:00:00.000Z",
  "provaCliente": "HMAC-SHA256 do transcript canônico em base64url"
}
```

Confirmação autenticada do host:

```json
{
  "tipo": "AUTENTICADO",
  "idRequisicao": "mesmo uuid",
  "versaoProtocolo": "1.0",
  "idSessao": "uuid",
  "nonceHost": "mesmo desafio",
  "nonceCliente": "mesmo nonce recebido",
  "provaHost": "HMAC-SHA256 do transcript canônico de confirmação em base64url"
}
```

Regras:

- tolerância máxima de relógio: 30 segundos;
- desafio e nonces de uso único durante a vida do processo;
- cache de desafios consumidos ou expirados para impedir replay;
- autenticação mútua: a IDE prova conhecimento do segredo e valida a prova independente do host;
- domínio, nomes, ordem, codificação e separadores do transcript HMAC serão fixos e cobertos por vetores de teste;
- comparação de HMAC em tempo constante;
- falha encerra o socket sem revelar qual campo estava incorreto;
- no máximo três tentativas de autenticação por conexão;
- segredo, HMAC e configuração nunca aparecem em logs ou mensagens de UI.

Depois do handshake, o socket autenticado representa uma única sessão. A POC deve aceitar somente um cliente IDE por vez.

## 8. Contratos de mensagens

### 8.1 Compatibilidade com a POC-05A

O framing permanece inalterado:

```text
[comprimento uint32 em ordem nativa][JSON codificado em UTF-8]
```

Os campos-base também permanecem:

```json
{
  "tipo": "PING",
  "idRequisicao": "uuid",
  "versaoProtocolo": "1.0"
}
```

PING/PONG `1.0` deve continuar funcionando com o mesmo comportamento e fixtures binárias da POC-05A. Novos tipos serão implementados por um roteador separado, sem alterar semanticamente o processador original.

### 8.2 Teste ponta a ponta

IDE → host:

```json
{
  "tipo": "TESTAR_PONTE",
  "idRequisicao": "uuid",
  "versaoProtocolo": "1.0",
  "idSessao": "uuid",
  "origem": "antigravity",
  "destino": "chrome",
  "sequencia": 1,
  "dados": {
    "versaoExtensaoIde": "0.1.0",
    "instanteEnvio": "2026-10-14T12:00:00.000Z"
  }
}
```

Host → Chrome:

```json
{
  "tipo": "TESTAR_PONTE",
  "idRequisicao": "mesmo uuid",
  "versaoProtocolo": "1.0",
  "origem": "antigravity",
  "destino": "chrome",
  "dados": {
    "versaoExtensaoIde": "0.1.0",
    "versaoHost": "0.2.0"
  }
}
```

Chrome → host → IDE:

```json
{
  "tipo": "PONTE_TESTADA",
  "idRequisicao": "mesmo uuid",
  "versaoProtocolo": "1.0",
  "origem": "chrome",
  "destino": "antigravity",
  "dados": {
    "versaoExtensaoChrome": "0.2.0",
    "versaoHost": "0.2.0",
    "resultado": "sucesso"
  }
}
```

O host remove `idSessao`, nonces e qualquer material de autenticação antes de encaminhar mensagens ao Chrome.

### 8.3 Erros

```json
{
  "tipo": "ERRO",
  "idRequisicao": "uuid ou null",
  "versaoProtocolo": "1.0",
  "erro": {
    "codigo": "CHROME_DESCONECTADO",
    "mensagem": "A extensão Chrome não está conectada ao host local.",
    "repetivel": true
  }
}
```

Códigos permitidos inicialmente:

- `CONFIGURACAO_AUSENTE`;
- `PIPE_INDISPONIVEL`;
- `NAO_AUTORIZADO`;
- `VERSAO_INCOMPATIVEL`;
- `MENSAGEM_INVALIDA`;
- `TIPO_NAO_PERMITIDO`;
- `ID_DUPLICADO`;
- `CHROME_DESCONECTADO`;
- `TEMPO_ESGOTADO`;
- `HOST_ENCERRANDO`.

Mensagens desconhecidas, campos adicionais não previstos, payloads acima de 64 KiB e identificadores com mais de 128 caracteres devem ser rejeitados.

## 9. Comando `Argonauta: Test Bridge`

### 9.1 Fluxo esperado

1. Usuário executa o comando na paleta do Antigravity.
2. A extensão verifica runtime local, configuração e segredo.
3. A UI mostra progresso cancelável: `Testando a ponte local do Argonauta...`.
4. A extensão conecta ao Named Pipe com timeout de 2 segundos.
5. IDE e host concluem o handshake.
6. A IDE envia `TESTAR_PONTE`.
7. O host encaminha a mensagem ao Chrome.
8. O Chrome responde `PONTE_TESTADA`.
9. O host correlaciona a resposta e a devolve à IDE.
10. A extensão mostra versões dos três componentes e latência total.
11. O socket é fechado de forma limpa.

Mensagem de sucesso proposta:

```text
Ponte validada: Antigravity 0.1.0 ↔ Host 0.2.0 ↔ Chrome 0.2.0 (42 ms).
```

O comando não deve ler arquivos do workspace, iniciar o Chrome, executar shell, alterar o Registro ou transmitir dados de projeto.

### 9.2 Estados de erro na UI

| Situação | Mensagem orientativa |
|---|---|
| Configuração ausente | `A ponte local ainda não foi configurada manualmente.` |
| Pipe ausente | `O Native Messaging Host não está disponível.` |
| Chrome desconectado | `Abra o Chrome e habilite a extensão Argonauta de teste.` |
| Autenticação rejeitada | `A configuração local da ponte não pôde ser autenticada.` |
| Versão divergente | `Os componentes da ponte usam versões incompatíveis.` |
| Timeout | `A ponte não respondeu dentro do limite esperado.` |

Detalhes técnicos redigidos poderão ir para um `OutputChannel` próprio, sem segredos, conteúdo do workspace ou stack traces brutos na interface.

## 10. Tratamento de concorrência e falhas

- `idRequisicao` deve ser único durante a vida do host.
- O host mantém um `Map` limitado de solicitações pendentes.
- Limite inicial: 32 solicitações pendentes, embora o comando de POC envie apenas uma.
- Timeout de ida e volta: 5 segundos.
- Respostas atrasadas, duplicadas ou com ID desconhecido são descartadas e registradas sem payload.
- Escritas devem respeitar backpressure de `stdout` e sockets.
- Uma mensagem inválida encerra somente a conexão ofensora quando possível; corrupção do stdio nativo encerra o host.
- Falha do Chrome invalida todas as solicitações pendentes.
- Falha do cliente IDE não encerra a conexão Chrome, mas limpa a sessão daquele cliente.
- Um segundo cliente IDE recebe `PIPE_OCUPADO` e é encerrado.

## 11. Estratégia de implementação

Todo o trabalho será realizado e depurado no Antigravity IDE. O VS Code não será instalado nem exigido.

### Etapa 0 — Gate de compatibilidade do Antigravity

- criar uma extensão mínima TypeScript em diretório novo;
- registrar um comando sem efeitos externos;
- registrar no relatório `vscode.version`, `process.version` e se a execução é desktop, local e não remota, sem expor caminhos ou identificadores do ambiente;
- confirmar acesso a `node:net`, `node:crypto`, `ExtensionContext.secrets` e `globalStorageUri`;
- confirmar que `extensionKind: ["ui"]` executa localmente;
- interromper a POC se o host for web-only ou remoto.

### Etapa 1 — Congelar contratos e regressões

- manter `tools/native-messaging-smoke/` funcional e sem alterações comportamentais;
- executar os 13 testes da POC-05A antes de qualquer mudança;
- criar fixtures binárias PING/PONG e testes de conformidade no novo experimento;
- versionar schemas dos novos tipos sem mudar `versaoProtocolo: "1.0"`.

### Etapa 2 — Transporte Named Pipe

- implementar servidor no Native Messaging Host e cliente na extensão do Antigravity;
- reutilizar framing uint32 + JSON UTF-8;
- validar fragmentação, concatenação, limites e backpressure;
- inspecionar a DACL efetiva do pipe e registrar sua SDDL sem identificadores pessoais;
- provar por testes negativos o bloqueio de clientes não autorizados e de acesso remoto;
- não implementar fallback TCP.

### Etapa 3 — Autenticação

- criar configuração local com ACL restrita mediante script manual;
- importar segredo em `ExtensionContext.secrets`;
- implementar challenge-response com nonce, timestamp e HMAC-SHA256;
- adicionar proteção contra replay e comparação em tempo constante.

### Etapa 4 — Porta persistente Chrome

- criar uma cópia evolutiva da extensão Chrome em novo diretório de experimento;
- usar nova identidade fixa e novo host `com.argonauta.poc05b`;
- adicionar service worker com `connectNative()`;
- oferecer ação manual **Conectar ponte** para iniciar a conexão durante a depuração;
- manter somente a permissão `nativeMessaging`;
- implementar reconexão limitada e encerramento limpo.

### Etapa 5 — Roteamento ponta a ponta

- implementar `TESTAR_PONTE`, `PONTE_TESTADA` e `ERRO`;
- correlacionar requisições e aplicar timeouts;
- registrar o comando `Argonauta: Test Bridge`;
- exibir versões e latência sem acessar o workspace.

### Etapa 6 — Evidência e limpeza

- executar testes automatizados;
- executar roteiro manual dentro do Antigravity IDE;
- repetir o teste após reiniciar Chrome e Antigravity;
- testar falhas controladas e desinstalação;
- registrar versões, data, resultados e limitações.

## 12. Estratégia de testes

### 12.1 Testes unitários

- compatibilidade binária com PING/PONG da POC-05A;
- serialização UTF-8, chunks fragmentados e mensagens concatenadas;
- validação de schemas e rejeição de campos/tipos desconhecidos;
- HMAC correto e incorreto;
- nonce duplicado e timestamp expirado;
- IDs ausentes, duplicados ou extensos;
- limite de 64 KiB para mensagens da POC-05B;
- mapeamento seguro de erros;
- cálculo de timeout e reconexão com limite.

### 12.2 Testes de integração sem Chrome real

- cliente IDE simulado ↔ Named Pipe real ↔ host simulado com stdio;
- Chrome simulado ↔ host ↔ cliente IDE real do protocolo;
- ida e volta completa com o mesmo `idRequisicao`;
- quebra do stdio durante uma solicitação;
- desconexão da IDE durante uma solicitação;
- segundo cliente simultâneo;
- encerramento sem processo, timer, socket ou handle pendente.

### 12.3 Testes de segurança

- segredo incorreto;
- origem Chrome incorreta;
- tentativa de replay;
- mensagem `EXECUTAR_COMANDO` ou outro tipo não permitido;
- payload contendo caminho, comando ou script;
- tentativa de conexão por outro usuário Windows;
- tentativa de acesso remoto ao pipe;
- inspeção dos logs para garantir ausência de segredo e payload.

### 12.4 Testes manuais no Antigravity IDE

1. Instalar a extensão da POC como VSIX ou modo de desenvolvimento suportado pelo Antigravity.
2. Registrar manualmente o novo Native Messaging Host após revisar o script.
3. Carregar a extensão Chrome da POC-05B e conferir seu ID.
4. Abrir ou reiniciar Chrome e Antigravity.
5. Executar `Argonauta: Test Bridge`.
6. Confirmar a mensagem de sucesso e as três versões.
7. Repetir dez vezes e registrar latência e falhas.
8. Encerrar Chrome e confirmar erro `CHROME_DESCONECTADO`.
9. Alterar temporariamente o segredo em ambiente de teste e confirmar `NAO_AUTORIZADO`.
10. Restaurar a configuração, testar novamente e executar a desinstalação manual.

## 13. Critérios de aceitação

### 13.1 Funcionais

- [ ] Extensão Argonauta carrega no Antigravity IDE sem exigir VS Code.
- [ ] `Argonauta: Test Bridge` aparece e executa no Command Palette.
- [ ] Uma solicitação percorre Antigravity → host → Chrome → host → Antigravity.
- [ ] A resposta preserva `idRequisicao` e informa as versões dos três componentes.
- [ ] Dez execuções consecutivas concluem sem falhas ou processos órfãos.
- [ ] Reiniciar Chrome e Antigravity não exige nova instalação ou alteração automática do Registro.

### 13.2 Segurança

- [ ] A extensão Chrome mantém somente `nativeMessaging`.
- [ ] `allowed_origins` contém exatamente o ID da extensão POC-05B, sem curingas.
- [ ] O Named Pipe aceita somente o usuário/logon atual e não é acessível remotamente.
- [ ] Cliente sem segredo válido é rejeitado.
- [ ] Replay, versão incompatível, mensagem excessiva e tipo desconhecido são rejeitados.
- [ ] Nenhum tipo de mensagem permite execução de shell, arquivo ou código.
- [ ] Nenhuma interface TCP, HTTP ou WebSocket é aberta.
- [ ] Logs não contêm segredo, HMAC, conteúdo de workspace, credenciais ou sessões.
- [ ] Registro só é alterado pelo script manual após confirmação explícita.

### 13.3 Compatibilidade e regressão

- [ ] Os 13 testes automatizados da POC-05A continuam aprovados sem alteração do diretório original.
- [ ] Fixtures PING/PONG `1.0` continuam binariamente compatíveis.
- [ ] Versão do Antigravity, versão da API VS Code e runtime Node.js são registradas na evidência.
- [ ] Recursos indisponíveis são marcados como `unsupported` ou `blocked`, sem uso de APIs internas.

### 13.4 Encerramento

- [ ] Fechar a porta nativa encerra o host e o Named Pipe.
- [ ] Desativar a extensão do Antigravity fecha o cliente e cancela timers.
- [ ] Solicitações pendentes recebem erro determinístico ao perder Chrome ou IDE.
- [ ] A desinstalação manual remove somente a configuração e a chave da POC-05B.

## 14. Riscos e mitigação

| Risco | Probabilidade / impacto | Mitigação ou gate |
|---|---|---|
| Antigravity não suportar alguma API pública necessária | Média / Alta | Etapa 0 antes de implementar a ponte; parar como `unsupported` |
| Extensão executar em host web ou remoto | Média / Alta | `extensionKind: ["ui"]`, detecção de runtime e recusa explícita |
| DACL padrão do pipe ser ampla | Média / Crítica | ACL explícita, namespace local, HMAC e teste negativo; bloquear avanço se não for verificável |
| Named Pipe aceitar acesso remoto | Baixa a média / Crítica | DACL por logon, teste remoto e ausência de fallback TCP |
| Processo host morrer junto com o service worker/porta | Média / Média | `connectNative`, reconexão limitada e erros determinísticos |
| Loop de reinicialização do Native Host | Média / Média | Backoff, máximo de cinco tentativas e retomada por ação do usuário |
| Dois perfis Chrome iniciarem hosts concorrentes | Média / Média | Instância única por `idInstalacao`; POC suporta um perfil por vez |
| Divergência do protocolo POC-05A | Baixa / Alta | baseline imutável, fixtures e suíte de regressão obrigatória |
| Cliente local malicioso tentar usar o pipe | Média / Alta | segredo de 256 bits, challenge-response, nonce e schemas fechados |
| Comprometimento da conta Windows atual | Fora do controle / Crítica | declarar limite; a POC não promete defesa contra usuário já comprometido |
| Confundir a ponte local com integração ao Gemini | Alta / Alta | documentação e UI limitadas a teste local; Gate G3 permanece aberto |

## 15. Decisões e gates antes da implementação

### Recomendação

Prosseguir com:

- extensão TypeScript compatível com API pública do VS Code, validada primeiro no Antigravity IDE;
- `connectNative()` mantido por service worker Chrome;
- Native Messaging Host como proprietário do Windows Named Pipe;
- Named Pipe autenticado com DACL restrita, segredo de instalação e challenge-response;
- protocolo PING/PONG `1.0` preservado e novos tipos isolados;
- novo diretório, nova extensão Chrome e novo registro `com.argonauta.poc05b`;
- nenhuma dependência do VS Code instalado.

### Gates de bloqueio

A implementação não deve começar ou avançar quando:

1. a extensão mínima não executar em um Extension Host Node.js local do Antigravity;
2. as APIs públicas necessárias não estiverem disponíveis;
3. a DACL e o bloqueio de acesso remoto do Named Pipe não puderem ser comprovados;
4. a POC-05A apresentar regressão;
5. qualquer etapa exigir acesso a páginas, sessões ou credenciais;
6. qualquer etapa depender de API interna ou não documentada do Antigravity.

## 16. Fontes técnicas

- [Google Antigravity — visão geral do IDE](https://www.antigravity.google/docs/ide/overview/)
- [Google Antigravity — extensões de IDE](https://www.antigravity.google/docs/ide/extensions/)
- [VS Code Extension API — Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host)
- [VS Code Extension API — capacidades comuns e armazenamento](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
- [VS Code Extension API — referência](https://code.visualstudio.com/api/references/vscode-api)
- [Chrome for Developers — Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Chrome for Developers — ciclo de vida do service worker](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Node.js 20 — IPC com `node:net`](https://nodejs.org/download/release/latest-v20.x/docs/api/net.html)
- [Microsoft — segurança e direitos de acesso de Named Pipes](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights)
- [Microsoft — comunicação entre processos no Windows](https://learn.microsoft.com/windows/apps/develop/communication/interprocess-communication)

## 17. Aprovação incremental

Em 14/10/2026, a arquitetura recebeu aprovação condicional com quatro revisões obrigatórias incorporadas neste documento:

1. inspeção efetiva da DACL e testes de bloqueio local não autorizado e remoto;
2. desafio imprevisível iniciado pelo host, transcript HMAC-SHA256 canônico, proteção contra replay e autenticação mútua;
3. conexão Chrome manual durante a depuração inicial;
4. aprovação separada antes de cada etapa.

A **Etapa 0 — Gate de compatibilidade do Antigravity** foi aprovada manualmente com 9 verificações `pass`, 0 `fail` e 0 `unsupported`.

A autorização atual cobre exclusivamente a **Etapa 1 — Congelamento de contratos, compatibilidade binária e regressões**. Nenhum Named Pipe, Native Messaging Host da POC-05B, script de instalação ou chave de Registro deve ser criado nesta etapa. O avanço para a Etapa 2 depende de nova revisão técnica e aprovação explícita.
