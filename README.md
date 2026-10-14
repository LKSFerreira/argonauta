# Argonauta

Extensão independente para IDEs compatíveis com VS Code que apoia um fluxo seguro de contexto, prompt e revisão de patches com provedores intercambiáveis.

O produto está em **discovery**. O modo inicial previsto é **Web Assistido**: ele não automatiza o Gemini Web, não extrai credenciais, cookies ou tokens e não deve ser apresentado como agente autônomo. Qualquer evolução para integração bidirecional depende de um canal público, permitido, reproduzível e compatível com os termos aplicáveis.

## Estado atual

- Stack planejada: TypeScript e Node.js 20+ para uma extensão VS Code.
- Nenhuma dependência ou código de extensão foi criado nesta etapa.
- A prioridade é executar e registrar os POCs de compatibilidade antes de implementar o MVP.

## Próximas ações

1. Preencher o inventário de hosts em [docs/experiments/compatibility-matrix.md](docs/experiments/compatibility-matrix.md).
2. Executar POC-02 manualmente no VS Code, sem manipulação de credenciais.
3. Registrar a evidência anonimizadamente e decidir o Gate G1 antes de iniciar a UX de navegador integrado.

## Documentação

- [PRD.md](PRD.md): requisitos, riscos, POCs e critérios de aceite.
- [ROADMAP.md](ROADMAP.md): andamento e marcos do produto.
- [docs/experiments/compatibility-matrix.md](docs/experiments/compatibility-matrix.md): resultados por host, versão e sistema operacional.
- [.metadocs/implementation_plan/2026-10-14-discovery.md](.metadocs/implementation_plan/2026-10-14-discovery.md): plano ativo de discovery.

## Segurança e privacidade

- Não enviar conteúdo do workspace sem prévia e consentimento explícito.
- Não coletar senhas, cookies de sessão ou tokens de login.
- Não gravar arquivos, executar comandos ou acessar caminhos fora do workspace sem aprovação.
- Não usar endpoints privados, automação de sessão ou mecanismos para contornar controles de plataforma.

## Docker

Docker não é necessário nesta fase: o projeto ainda não possui serviço, aplicação executável ou dependências para conteinerização. Essa decisão deve ser reavaliada quando houver um processo de build ou CI que se beneficie de ambiente reproduzível.
