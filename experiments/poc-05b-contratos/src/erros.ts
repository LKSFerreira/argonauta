export const CODIGOS_ERRO_PROTOCOLO = [
  'CABECALHO_INCOMPLETO',
  'CAMPO_NAO_PERMITIDO',
  'CAMPO_OBRIGATORIO_AUSENTE',
  'IDENTIFICADOR_INVALIDO',
  'JSON_INVALIDO',
  'MENSAGEM_INVALIDA',
  'PAYLOAD_TRUNCADO',
  'PREFIXO_INVALIDO',
  'TAMANHO_EXCEDIDO',
  'TIPO_NAO_PERMITIDO',
  'UTF8_INVALIDO',
  'VALOR_INVALIDO',
  'VERSAO_INCOMPATIVEL'
] as const;

export type CodigoErroProtocolo = (typeof CODIGOS_ERRO_PROTOCOLO)[number];

const MENSAGENS_SEGURAS: Readonly<Record<CodigoErroProtocolo, string>> = {
  CABECALHO_INCOMPLETO: 'O cabeçalho da mensagem está incompleto.',
  CAMPO_NAO_PERMITIDO: 'A mensagem contém um campo não permitido.',
  CAMPO_OBRIGATORIO_AUSENTE: 'A mensagem não contém todos os campos obrigatórios.',
  IDENTIFICADOR_INVALIDO: 'A mensagem contém um identificador inválido.',
  JSON_INVALIDO: 'O payload não contém um documento JSON válido.',
  MENSAGEM_INVALIDA: 'A mensagem não possui uma estrutura válida.',
  PAYLOAD_TRUNCADO: 'O payload terminou antes do comprimento declarado.',
  PREFIXO_INVALIDO: 'O prefixo de comprimento é inválido.',
  TAMANHO_EXCEDIDO: 'A mensagem excede o limite permitido.',
  TIPO_NAO_PERMITIDO: 'O tipo de mensagem não é permitido.',
  UTF8_INVALIDO: 'O payload não contém UTF-8 válido.',
  VALOR_INVALIDO: 'A mensagem contém um valor inválido.',
  VERSAO_INCOMPATIVEL: 'A versão do protocolo não é compatível.'
};

export class ErroProtocolo extends Error {
  public readonly codigo: CodigoErroProtocolo;

  public constructor(codigo: CodigoErroProtocolo) {
    super(MENSAGENS_SEGURAS[codigo]);
    this.name = 'ErroProtocolo';
    this.codigo = codigo;
  }
}

export function falhar(codigo: CodigoErroProtocolo): never {
  throw new ErroProtocolo(codigo);
}
