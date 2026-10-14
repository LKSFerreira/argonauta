# Política de segurança

## Escopo atual

O Argonauta está em discovery. Os componentes presentes são contratos reutilizáveis e ferramentas locais de validação; ainda não existe extensão de produção.

## Relato responsável

Não publique detalhes exploráveis, credenciais ou dados pessoais em uma issue pública. Use os recursos privados de reporte de segurança do GitHub quando estiverem habilitados no repositório. Se esse canal ainda não estiver disponível, abra uma issue sem detalhes sensíveis solicitando um canal privado ao mantenedor.

Não envie senhas, cookies, tokens, perfis de navegador, arquivos `.env` ou chaves privadas.

## Garantias obrigatórias

- Sem captura de credenciais ou sessões.
- Sem endpoints privados ou automação do Gemini Web.
- Sem execução arbitrária de comandos recebidos.
- Sem interfaces acessíveis pela rede.
- Chrome Native Messaging restrito à origem exata aprovada.
- Alterações no Registro do Windows somente por scripts manuais com confirmação.
- Entradas tratadas como não confiáveis e validadas antes da serialização.
- Payload máximo de 64 KiB nos contratos novos.
- Profundidade estrutural máxima e processamento incremental limitado.

## Atualizações e dependências

Dependências são fixadas no `package-lock.json`. A validação automatizada executa `npm ci`, testes, verificação de fixtures e `npm audit --audit-level=high`.

Consulte [docs/security/threat-model.md](docs/security/threat-model.md) para os limites de confiança e riscos residuais.
