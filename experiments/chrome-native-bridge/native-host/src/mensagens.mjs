export const VERSAO_PROTOCOLO = '1.0';
export const VERSAO_HOST = '0.1.0';
export const ORIGEM_PERMITIDA = 'chrome-extension://kmhnfligldbfbjmdmodckpmbnfmehfba/';

function validarObjeto(mensagem) {
  if (mensagem === null || typeof mensagem !== 'object' || Array.isArray(mensagem)) {
    throw new TypeError('A mensagem precisa ser um objeto JSON.');
  }
}

export function validarOrigemChamadora(argumentos) {
  const [origem] = argumentos;

  if (origem !== ORIGEM_PERMITIDA) {
    throw new Error('A origem chamadora não está autorizada.');
  }
}

export function processarMensagem(mensagem) {
  validarObjeto(mensagem);

  if (mensagem.tipo !== 'PING') {
    throw new Error('Somente mensagens PING são aceitas nesta prova de conceito.');
  }

  if (typeof mensagem.idRequisicao !== 'string' || mensagem.idRequisicao.length === 0) {
    throw new Error('A mensagem PING deve informar um identificador de requisição.');
  }

  if (mensagem.idRequisicao.length > 128) {
    throw new Error('O identificador de requisição excede o limite permitido.');
  }

  if (mensagem.versaoProtocolo !== VERSAO_PROTOCOLO) {
    throw new Error('A versão do protocolo não é compatível com o host.');
  }

  return {
    tipo: 'PONG',
    idRequisicao: mensagem.idRequisicao,
    versaoProtocolo: VERSAO_PROTOCOLO,
    versaoHost: VERSAO_HOST,
  };
}
