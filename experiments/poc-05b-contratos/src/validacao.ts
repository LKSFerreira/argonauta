import { falhar } from './erros.js';
import { validarEstruturaJsonPassiva } from './estrutura-json.js';
import {
  CODIGOS_ERRO_MENSAGEM,
  LIMITE_IDENTIFICADOR,
  LIMITE_PAYLOAD_CONTRATO,
  type MensagemPoc05B,
  VERSAO_PROTOCOLO
} from './tipos.js';

type ObjetoDesconhecido = Readonly<Record<string, unknown>>;

const TIPOS_PERMITIDOS = new Set([
  'DESAFIO_AUTENTICACAO',
  'AUTENTICAR',
  'AUTENTICADO',
  'TESTAR_PONTE',
  'PONTE_TESTADA',
  'ERRO'
]);
const PADRAO_IDENTIFICADOR = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PADRAO_BASE64URL = /^[A-Za-z0-9_-]+$/;
const PADRAO_VERSAO = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PADRAO_INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function comoObjeto(valor: unknown): ObjetoDesconhecido {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    falhar('MENSAGEM_INVALIDA');
  }

  const prototipo = Object.getPrototypeOf(valor) as unknown;
  if (prototipo !== Object.prototype && prototipo !== null) {
    falhar('MENSAGEM_INVALIDA');
  }

  return valor as ObjetoDesconhecido;
}

function validarCampos(
  objeto: ObjetoDesconhecido,
  camposObrigatorios: readonly string[]
): void {
  for (const campo of camposObrigatorios) {
    if (!Object.hasOwn(objeto, campo)) {
      falhar('CAMPO_OBRIGATORIO_AUSENTE');
    }
  }

  const permitidos = new Set(camposObrigatorios);
  if (Object.keys(objeto).some((campo) => !permitidos.has(campo))) {
    falhar('CAMPO_NAO_PERMITIDO');
  }
}

function validarTexto(valor: unknown, minimo: number, maximo: number): asserts valor is string {
  if (
    typeof valor !== 'string'
    || valor.length < minimo
    || valor.length > maximo
    || /[\u0000-\u001f\u007f]/u.test(valor)
  ) {
    falhar('VALOR_INVALIDO');
  }
}

function validarIdentificador(valor: unknown): asserts valor is string {
  if (
    typeof valor !== 'string'
    || valor.length > LIMITE_IDENTIFICADOR
    || !PADRAO_IDENTIFICADOR.test(valor)
  ) {
    falhar('IDENTIFICADOR_INVALIDO');
  }
}

function validarVersaoProtocolo(valor: unknown): asserts valor is typeof VERSAO_PROTOCOLO {
  if (valor !== VERSAO_PROTOCOLO) {
    falhar('VERSAO_INCOMPATIVEL');
  }
}

function validarVersaoComponente(valor: unknown): asserts valor is string {
  if (typeof valor !== 'string' || !PADRAO_VERSAO.test(valor)) {
    falhar('VALOR_INVALIDO');
  }
}

function validarInstante(valor: unknown): asserts valor is string {
  if (typeof valor !== 'string' || !PADRAO_INSTANTE.test(valor)) {
    falhar('VALOR_INVALIDO');
  }

  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime()) || instante.toISOString() !== valor) {
    falhar('VALOR_INVALIDO');
  }
}

function validarBase64Url(valor: unknown, minimo: number, maximo: number): asserts valor is string {
  if (
    typeof valor !== 'string'
    || valor.length < minimo
    || valor.length > maximo
    || !PADRAO_BASE64URL.test(valor)
  ) {
    falhar('VALOR_INVALIDO');
  }
}

function validarBase(objeto: ObjetoDesconhecido): void {
  validarIdentificador(objeto.idRequisicao);
  validarVersaoProtocolo(objeto.versaoProtocolo);
}

function validarDesafio(objeto: ObjetoDesconhecido): void {
  validarCampos(objeto, [
    'tipo',
    'idRequisicao',
    'versaoProtocolo',
    'nonceHost',
    'instanteHost'
  ]);
  validarBase(objeto);
  validarBase64Url(objeto.nonceHost, 22, 128);
  validarInstante(objeto.instanteHost);
}

function validarAutenticar(objeto: ObjetoDesconhecido): void {
  validarCampos(objeto, [
    'tipo',
    'idRequisicao',
    'versaoProtocolo',
    'idInstalacao',
    'nonceHost',
    'nonceCliente',
    'instanteCliente',
    'provaCliente'
  ]);
  validarBase(objeto);
  validarIdentificador(objeto.idInstalacao);
  validarBase64Url(objeto.nonceHost, 22, 128);
  validarBase64Url(objeto.nonceCliente, 22, 128);
  validarInstante(objeto.instanteCliente);
  validarBase64Url(objeto.provaCliente, 43, 43);
}

function validarAutenticado(objeto: ObjetoDesconhecido): void {
  validarCampos(objeto, [
    'tipo',
    'idRequisicao',
    'versaoProtocolo',
    'idSessao',
    'nonceHost',
    'nonceCliente',
    'provaHost'
  ]);
  validarBase(objeto);
  validarIdentificador(objeto.idSessao);
  validarBase64Url(objeto.nonceHost, 22, 128);
  validarBase64Url(objeto.nonceCliente, 22, 128);
  validarBase64Url(objeto.provaHost, 43, 43);
}

function validarTestarPonte(objeto: ObjetoDesconhecido): void {
  if (Object.hasOwn(objeto, 'idSessao')) {
    validarCampos(objeto, [
      'tipo',
      'idRequisicao',
      'versaoProtocolo',
      'idSessao',
      'origem',
      'destino',
      'sequencia',
      'dados'
    ]);
    validarBase(objeto);
    validarIdentificador(objeto.idSessao);
    if (!Number.isSafeInteger(objeto.sequencia) || (objeto.sequencia as number) < 1) {
      falhar('VALOR_INVALIDO');
    }
    const dados = comoObjeto(objeto.dados);
    validarCampos(dados, ['versaoExtensaoIde', 'instanteEnvio']);
    validarVersaoComponente(dados.versaoExtensaoIde);
    validarInstante(dados.instanteEnvio);
  } else {
    validarCampos(objeto, [
      'tipo',
      'idRequisicao',
      'versaoProtocolo',
      'origem',
      'destino',
      'dados'
    ]);
    validarBase(objeto);
    const dados = comoObjeto(objeto.dados);
    validarCampos(dados, ['versaoExtensaoIde', 'versaoHost']);
    validarVersaoComponente(dados.versaoExtensaoIde);
    validarVersaoComponente(dados.versaoHost);
  }

  if (objeto.origem !== 'antigravity' || objeto.destino !== 'chrome') {
    falhar('VALOR_INVALIDO');
  }
}

function validarPonteTestada(objeto: ObjetoDesconhecido): void {
  validarCampos(objeto, [
    'tipo',
    'idRequisicao',
    'versaoProtocolo',
    'origem',
    'destino',
    'dados'
  ]);
  validarBase(objeto);
  if (objeto.origem !== 'chrome' || objeto.destino !== 'antigravity') {
    falhar('VALOR_INVALIDO');
  }
  const dados = comoObjeto(objeto.dados);
  validarCampos(dados, ['versaoExtensaoChrome', 'versaoHost', 'resultado']);
  validarVersaoComponente(dados.versaoExtensaoChrome);
  validarVersaoComponente(dados.versaoHost);
  if (dados.resultado !== 'sucesso') {
    falhar('VALOR_INVALIDO');
  }
}

function validarErro(objeto: ObjetoDesconhecido): void {
  validarCampos(objeto, ['tipo', 'idRequisicao', 'versaoProtocolo', 'erro']);
  if (objeto.idRequisicao !== null) {
    validarIdentificador(objeto.idRequisicao);
  }
  validarVersaoProtocolo(objeto.versaoProtocolo);
  const erro = comoObjeto(objeto.erro);
  validarCampos(erro, ['codigo', 'mensagem', 'repetivel']);
  if (
    typeof erro.codigo !== 'string'
    || !(CODIGOS_ERRO_MENSAGEM as readonly string[]).includes(erro.codigo)
  ) {
    falhar('VALOR_INVALIDO');
  }
  validarTexto(erro.mensagem, 1, 256);
  if (typeof erro.repetivel !== 'boolean') {
    falhar('VALOR_INVALIDO');
  }
}

function validarTamanho(valor: unknown): void {
  validarEstruturaJsonPassiva(valor);
  let json: string | undefined;
  try {
    json = JSON.stringify(valor);
  } catch {
    falhar('JSON_INVALIDO');
  }

  if (json === undefined) {
    falhar('MENSAGEM_INVALIDA');
  }

  if (Buffer.byteLength(json, 'utf8') > LIMITE_PAYLOAD_CONTRATO) {
    falhar('TAMANHO_EXCEDIDO');
  }
}

export function validarMensagem(valor: unknown): MensagemPoc05B {
  validarTamanho(valor);
  const objeto = comoObjeto(valor);

  if (typeof objeto.tipo !== 'string' || !TIPOS_PERMITIDOS.has(objeto.tipo)) {
    falhar('TIPO_NAO_PERMITIDO');
  }

  switch (objeto.tipo) {
    case 'DESAFIO_AUTENTICACAO':
      validarDesafio(objeto);
      break;
    case 'AUTENTICAR':
      validarAutenticar(objeto);
      break;
    case 'AUTENTICADO':
      validarAutenticado(objeto);
      break;
    case 'TESTAR_PONTE':
      validarTestarPonte(objeto);
      break;
    case 'PONTE_TESTADA':
      validarPonteTestada(objeto);
      break;
    case 'ERRO':
      validarErro(objeto);
      break;
    default:
      falhar('TIPO_NAO_PERMITIDO');
  }

  return objeto as unknown as MensagemPoc05B;
}
