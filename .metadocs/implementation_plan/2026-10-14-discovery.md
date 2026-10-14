# Plano de implementação — Discovery inicial

## Objetivo

Reduzir as hipóteses de maior risco do Argonauta antes da implementação do MVP: compatibilidade dos hosts, uso legítimo do Gemini Web em navegador integrado e fronteira suportada entre extensão e navegador.

## Escopo

1. Executar POC-01 e preencher a matriz de compatibilidade.
2. Executar POC-02 e POC-03 manualmente no VS Code, usando somente autenticação normal do usuário.
3. Executar POC-04 no Antigravity IDE apenas se o host disponibilizar recurso equivalente.
4. Documentar POC-05 com APIs públicas, resultados de teste e avaliação dos termos aplicáveis.
5. Registrar a decisão dos Gates G1 e G3.

## Fora do escopo

- Extração de cookies, tokens ou credenciais.
- Automação de interface web, uso de endpoints privados ou contorno de controles de acesso.
- Implementação de agente autônomo, tool calling ou execução de terminal.
- Instalação de dependências e criação prematura da extensão.

## Riscos e controles

| Risco | Controle |
|---|---|
| Login indisponível no navegador integrado | Registrar o resultado e usar navegador externo apenas como comparação; não enfraquecer proteções. |
| API disponível somente para agentes nativos | Tratar como bloqueio do Web Bridge e manter o modo manual como alternativa. |
| Exposição de dados pessoais ou do workspace | Anonimizar evidências e não enviar conteúdo sem consentimento explícito. |
| Conclusão além das evidências | Marcar resultados como `pass`, `fail`, `unsupported` ou `blocked` com a versão testada. |

## Validação de saída

- A matriz contém versões, data, resultado e evidência anonimizadas para cada POC executado.
- O Gate G1 só avança com POC-02 e POC-03 aprovadas.
- O Gate G3 só avança com canal documentado, permitido e testável.
- Caso G3 falhe, o backlog mantém apenas Web Assistido e APIs oficiais como caminhos viáveis.
