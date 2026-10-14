# Matriz de compatibilidade

> Preencha esta matriz apenas com resultados reproduzidos em ambientes próprios ou autorizados. O status `unsupported` indica ausência de recurso ou API compatível; não é uma inferência sobre versões não testadas.

| Host | Versão do host | Sistema operacional | Data | Navegador integrado | Login Gemini Web | Argon disponível | Canal público extensão-navegador | Status | Evidência anonimizadas | Observações |
|---|---|---|---|---|---|---|---|---|---|---|
| VS Code Stable | Não testado | Windows | — | Não testado | Não testado | Não testado | Não testado | pending | — | Executar POC-01, POC-02, POC-03 e POC-05. |
| Antigravity IDE | Não testado | Windows | — | Não testado | Não testado | Não testado | Não testado | pending | — | Executar POC-04 somente se o recurso existir. |

## Registro obrigatório por POC

Cada relatório de experimento deve registrar:

- ID do POC e data;
- versão do host, sistema operacional e pré-condições;
- passos exatos e resultado esperado;
- resultado observado, evidência sem dados pessoais e impacto;
- decisão: `pass`, `fail`, `unsupported` ou `blocked`.

## Limites de segurança

- Use apenas o fluxo normal de autenticação do provedor.
- Não capture credenciais, cookies, tokens, capturas com dados pessoais ou conteúdo de projetos privados.
- Não use scripts de injeção, endpoints privados ou automação que contorne controles da plataforma.
