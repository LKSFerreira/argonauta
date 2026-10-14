# POC-05B — Etapa 1: Contratos, compatibilidade binária e regressões

## Estado

**Implementação técnica:** concluída em 14/10/2026 e aguardando revisão.

**Avanço para a Etapa 2:** não autorizado. Depende de revisão desta entrega e aprovação explícita do responsável pelo projeto.

## Objetivo e limites

Esta etapa congela a representação binária PING/PONG `1.0` aprovada na POC-05A e define contratos estritos para as mensagens futuras da POC-05B. A implementação está isolada em `experiments/poc-05b-contratos/`.

Não foram implementados Named Pipes, servidor ou cliente IPC, novo Native Messaging Host, comunicação com Chrome, HMAC, provisionamento de segredos, alteração do Registro, acesso à rede, Gemini Web ou execução de comandos.

O diretório `experiments/chrome-native-bridge/` não foi modificado. Seu limite legado de 1 MiB permanece intacto; o limite de 64 KiB aplica-se somente aos novos contratos.

## Arquitetura

| Módulo | Responsabilidade |
|---|---|
| `src/tipos.ts` | Tipos TypeScript, versão `1.0`, limites e códigos de erro funcionais. |
| `src/erros.ts` | Erros locais com códigos determinísticos e mensagens sem conteúdo recebido. |
| `src/estrutura-json.ts` | Inspeção estrutural iterativa e compartilhada, sem executar comportamento do objeto. |
| `src/enquadramento.ts` | Serialização e decodificação incremental de `[uint32][JSON UTF-8]`, sem transporte. |
| `src/validacao.ts` | Validação estrita em tempo de execução, sem coerção ou mutação. |
| `fixtures/` | Artefatos binários PING/PONG estáveis e manifesto verificável. |
| `scripts/regenerar-fixtures.mjs` | Regeneração manual e explícita dos artefatos fixos. Não participa da execução dos testes. |
| `testes/` | Compatibilidade real com a POC-05A, framing, schemas e robustez. |

Contrato, serialização e transporte permanecem separados. Esta etapa não possui código capaz de abrir porta, pipe, processo ou conexão.

## Contratos congelados

Todos os contratos usam `versaoProtocolo: "1.0"`, recusam campos adicionais e possuem payload JSON UTF-8 máximo de 65.536 bytes.

| Tipo | Campos obrigatórios principais |
|---|---|
| `DESAFIO_AUTENTICACAO` | `idRequisicao`, `versaoProtocolo`, `nonceHost`, `instanteHost` |
| `AUTENTICAR` | campos-base, `idInstalacao`, `nonceHost`, `nonceCliente`, `instanteCliente`, `provaCliente` |
| `AUTENTICADO` | campos-base, `idSessao`, `nonceHost`, `nonceCliente`, `provaHost` |
| `TESTAR_PONTE` IDE → host | campos-base, `idSessao`, origem/destino, `sequencia`, versão da extensão IDE e instante |
| `TESTAR_PONTE` host → Chrome | campos-base, origem/destino e versões da extensão IDE e do host |
| `PONTE_TESTADA` | campos-base, origem/destino, versões da extensão Chrome e do host, resultado `sucesso` |
| `ERRO` | identificador ou `null`, versão e objeto com código permitido, mensagem e indicação de repetição |

### Regras estruturais

- identificadores possuem de 1 a 128 caracteres e aceitam somente letras ASCII, números, ponto, sublinhado, dois-pontos e hífen;
- instantes usam UTC no formato ISO 8601 com milissegundos;
- versões de componentes usam três partes numéricas, como `0.2.0`;
- nonces são strings base64url sem preenchimento, de 22 a 128 caracteres;
- provas possuem 43 caracteres base64url, o tamanho textual de 32 bytes em base64url sem preenchimento;
- códigos de `ERRO` permanecem restritos à lista da seção 8.3 do plano;
- entradas com getters, setters, `toJSON`, funções, proxies, protótipos comportamentais ou referências circulares são rejeitadas antes da serialização;
- a inspeção usa travessia iterativa e rejeita estruturas acima de 64 níveis com `PROFUNDIDADE_EXCEDIDA`, sem depender da pilha de chamadas;
- nenhuma validação calcula HMAC ou afirma que nonce, prova ou instante são criptograficamente válidos. Essas verificações pertencem a etapas posteriores.

### Ambiguidade resolvida de `TESTAR_PONTE`

O plano usa o mesmo discriminador `TESTAR_PONTE` para dois formatos: IDE → host e host → Chrome. Alterar silenciosamente o tipo quebraria o contrato proposto. Por isso, a Etapa 1 congela uma união de duas variantes estritas:

1. a presença de `idSessao` seleciona a variante IDE → host, que também exige `sequencia` e `instanteEnvio`;
2. sua ausência seleciona a variante sanitizada host → Chrome, que exige `versaoHost`;
3. misturar campos das variantes é rejeitado.

A futura camada de transporte/roteamento deverá autorizar explicitamente qual variante é permitida em cada direção real da comunicação antes de aceitar a mensagem. A forma estrutural, sozinha, não concede autorização. Isso não foi implementado nesta etapa.

## Limites de memória do enquadramento

O decodificador não concatena o fragmento recebido ao estado interno. Ele copia incrementalmente somente os bytes necessários para:

- um cabeçalho fixo de 4 bytes;
- um único payload declarado, limitado a 65.536 bytes.

Cada chamada de `adicionar()` aceita no máximo 65.540 bytes — um frame máximo completo — e retorna no máximo 32 mensagens concatenadas. Fragmentos ou lotes acima desses limites encerram o decoder com `FRAGMENTO_EXCEDIDO` ou `LOTE_EXCEDIDO`. Mensagens fragmentadas entre chamadas e frames concatenados dentro dos limites permanecem suportados. O parâmetro legado que permite reduzir o limite de payload é preservado, mas não pode ampliar o teto de 64 KiB.

O fragmento fornecido continua pertencendo ao chamador e necessariamente já existe antes da chamada; o decoder o rejeita antes de realizar qualquer cópia e não retém referência a ele.

## Compatibilidade PING/PONG

As fixtures usam valores públicos e fixos:

- `idRequisicao`: `fixture-ping-1`;
- protocolo: `1.0`;
- versão do host no PONG: `0.1.0`;
- codificação: UTF-8;
- prefixo: inteiro sem sinal de 32 bits;
- ordem efetivamente usada no Windows: little-endian.

| Fixture | Payload | Total | SHA-256 |
|---|---:|---:|---|
| `ping-v1-windows-le.bin` | 71 bytes | 75 bytes | `414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd` |
| `pong-v1-windows-le.bin` | 92 bytes | 96 bytes | `4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392` |

O arquivo `fixtures/manifesto.json` registra também o JSON exato e a sequência hexadecimal integral. Os testes leem os arquivos `.bin` já versionados; não regeneram fixtures e comparam seus bytes com:

1. os hashes e valores congelados do manifesto;
2. o serializador da nova camada;
3. o serializador real da POC-05A importado sem modificar seu código;
4. os dois decodificadores;
5. a transformação real PING → PONG da POC-05A.

### Regeneração deliberada

Somente depois de uma decisão explícita de alteração do protocolo, executar no diretório do experimento:

```powershell
npm run regenerar-fixtures
```

Esse comando sobrescreve os dois binários e o manifesto. Depois dele, o diff hexadecimal, os comprimentos e os hashes devem ser revisados. O comando não integra `compilar`, `test` ou `verificar`.

## Comandos

O experimento não instala dependências. Para manter a execução offline nesta etapa, ele usa o TypeScript 5.9.3 e os tipos Node.js já presentes no probe da Etapa 0.

```powershell
cd experiments/poc-05b-contratos
npm run compilar
npm test
```

Regressões:

```powershell
cd ../chrome-native-bridge
npm test

cd ../antigravity-extension-probe
npm run compilar
npm test
```

## Evidências observadas

O repositório estava limpo no início da tarefa. A baseline foi estabelecida sobre o commit local `d304344da478d43ba1dfe5199e2569c1845d5881` (`:books: docs: documenta diagnóstico e testes automatizados da Etapa 0 em docs/experiments/POC-05B-ETAPA-0.md`).

Linha de base executada antes da implementação:

| Verificação | Resultado |
|---|---|
| POC-05A | 13 aprovados, 0 falhas |
| Etapa 0 — compilação isolada | código de saída 0 |
| Etapa 0 — testes | 11 aprovados, 0 falhas |

Rodada final executada em Windows com Node.js 24.16.0 e npm 11.13.0:

| Comando | Resultado observado |
|---|---|
| `npm run compilar` no novo experimento | código de saída 0 |
| `npm test` no novo experimento | 53 aprovados, 0 falhas |
| `npm test` na POC-05A | 13 aprovados, 0 falhas |
| `npm test` no probe da Etapa 0 | 11 aprovados, 0 falhas |

Não existem scripts de lint ou auditoria configurados no novo pacote. Nenhuma dependência foi adicionada ou instalada, portanto não foi criado lockfile nem executada auditoria de pacote sem alvo aplicável.

## Problemas encontrados e soluções

### Tipos Node.js fora do novo pacote

A primeira compilação encontrou o TypeScript, mas não os tipos Node.js. O `tsconfig.json` passou a apontar explicitamente para `../antigravity-extension-probe/node_modules/@types`, sem download, instalação ou duplicação de dependências.

### Efeito colateral por propriedade acessora

A primeira rodada da nova suíte obteve 42 aprovações e 1 falha. O teste demonstrou que `JSON.stringify` podia executar um `getter` antes da validação. A fronteira passou a inspecionar descritores e a rejeitar propriedades acessoras, funções, protótipos comportamentais e ciclos antes do cálculo de tamanho. A rodada seguinte aprovou os 43 testes então existentes.

### Robustez final antes da Etapa 2

A revisão final identificou que a proteção anterior era aplicada por `validarMensagem()`, mas podia ser contornada ao chamar `serializarEnquadramento()` diretamente. A inspeção estrutural foi extraída para um módulo sem dependência do schema e agora é obrigatória nas duas entradas. Testes diretos comprovam que getter, setter, `toJSON` e armadilhas de `Proxy` não são executados.

O decoder anterior usava `Buffer.concat()` com o fragmento completo antes de ler o cabeçalho. Ele foi substituído por uma máquina de estados incremental com buffers limitados, limite de fragmento e limite de frames por chamada.

A validação estrutural recursiva foi substituída por uma pilha explícita. Objetos e arrays excessivamente profundos agora produzem `PROFUNDIDADE_EXCEDIDA`, sem `RangeError` não tratado.

## Divergências documentais sincronizadas

- `POC-05A.md` dizia simultaneamente que o teste manual estava aprovado e pendente. A frase pendente foi corrigida conforme a aprovação manual registrada em 14/10/2026.
- `POC-05B-ETAPA-0.md` ainda bloqueava a Etapa 1. O estado foi sincronizado com a evidência fornecida pelo mantenedor: 9 `pass`, 0 `fail` e 0 `unsupported`. Não foi criado um log runtime retroativo.
- `POC-05B-PLAN.md` dizia que somente a Etapa 0 estava autorizada. O texto agora registra a autorização exclusiva da Etapa 1 e mantém a Etapa 2 dependente de nova aprovação.

## Riscos e questões em aberto

- O prefixo aprovado usa ordem nativa; no Windows validado isso significa little-endian. Uma futura portabilidade exige decisão explícita, sem alterar estas fixtures.
- A união das duas variantes `TESTAR_PONTE` exige autorização por direção na futura camada de transporte/roteamento; essa autorização não deve ser inferida apenas pelos campos presentes.
- Os limites de 65.540 bytes por fragmento e 32 frames por chamada são deliberadamente conservadores para a POC. Qualquer alteração futura deve ser explícita e acompanhada de testes de memória e backpressure.
- Formato e tamanho estrutural de nonces e provas não substituem geração segura, transcript canônico, comparação em tempo constante ou proteção contra replay.
- A reutilização do toolchain da Etapa 0 evita instalação nesta etapa, mas cria uma dependência local documentada entre experimentos. Um toolchain compartilhado poderá ser decidido quando houver estrutura de produção.
- Inspeção de DACL, bloqueio de clientes locais/remotos e encerramento de sockets continuam fora do escopo até a etapa de transporte autorizada.

## Critérios para avançar à Etapa 2

- compilação estrita e testes desta etapa aprovados;
- 13/13 testes da POC-05A aprovados sem alteração do diretório original;
- 11/11 testes da Etapa 0 aprovados;
- revisão byte a byte das fixtures e dos hashes;
- revisão dos schemas, especialmente das duas variantes `TESTAR_PONTE`;
- diff sem dependências, permissões, transportes, segredos ou dados pessoais;
- aprovação explícita do responsável pelo projeto.

Mesmo com todos os critérios técnicos aprovados, esta documentação não autoriza automaticamente a Etapa 2.
