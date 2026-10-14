export const VERSAO_PROTOCOLO = '1.0' as const;
export const LIMITE_PAYLOAD_CONTRATO = 64 * 1024;
export const LIMITE_IDENTIFICADOR = 128;

export const CODIGOS_ERRO_MENSAGEM = [
  'CONFIGURACAO_AUSENTE',
  'PIPE_INDISPONIVEL',
  'NAO_AUTORIZADO',
  'VERSAO_INCOMPATIVEL',
  'MENSAGEM_INVALIDA',
  'TIPO_NAO_PERMITIDO',
  'ID_DUPLICADO',
  'CHROME_DESCONECTADO',
  'TEMPO_ESGOTADO',
  'HOST_ENCERRANDO'
] as const;

export type CodigoErroMensagem = (typeof CODIGOS_ERRO_MENSAGEM)[number];

interface MensagemBase<Tipo extends string> {
  readonly tipo: Tipo;
  readonly idRequisicao: string;
  readonly versaoProtocolo: typeof VERSAO_PROTOCOLO;
}

export interface DesafioAutenticacao extends MensagemBase<'DESAFIO_AUTENTICACAO'> {
  readonly nonceHost: string;
  readonly instanteHost: string;
}

export interface Autenticar extends MensagemBase<'AUTENTICAR'> {
  readonly idInstalacao: string;
  readonly nonceHost: string;
  readonly nonceCliente: string;
  readonly instanteCliente: string;
  readonly provaCliente: string;
}

export interface Autenticado extends MensagemBase<'AUTENTICADO'> {
  readonly idSessao: string;
  readonly nonceHost: string;
  readonly nonceCliente: string;
  readonly provaHost: string;
}

export interface TestarPonteIdeHost extends MensagemBase<'TESTAR_PONTE'> {
  readonly idSessao: string;
  readonly origem: 'antigravity';
  readonly destino: 'chrome';
  readonly sequencia: number;
  readonly dados: {
    readonly versaoExtensaoIde: string;
    readonly instanteEnvio: string;
  };
}

export interface TestarPonteHostChrome extends MensagemBase<'TESTAR_PONTE'> {
  readonly origem: 'antigravity';
  readonly destino: 'chrome';
  readonly dados: {
    readonly versaoExtensaoIde: string;
    readonly versaoHost: string;
  };
}

export type TestarPonte = TestarPonteIdeHost | TestarPonteHostChrome;

export interface PonteTestada extends MensagemBase<'PONTE_TESTADA'> {
  readonly origem: 'chrome';
  readonly destino: 'antigravity';
  readonly dados: {
    readonly versaoExtensaoChrome: string;
    readonly versaoHost: string;
    readonly resultado: 'sucesso';
  };
}

export interface MensagemErro {
  readonly tipo: 'ERRO';
  readonly idRequisicao: string | null;
  readonly versaoProtocolo: typeof VERSAO_PROTOCOLO;
  readonly erro: {
    readonly codigo: CodigoErroMensagem;
    readonly mensagem: string;
    readonly repetivel: boolean;
  };
}

export type MensagemPoc05B =
  | DesafioAutenticacao
  | Autenticar
  | Autenticado
  | TestarPonte
  | PonteTestada
  | MensagemErro;
