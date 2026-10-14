import os from 'node:os';

export const TAMANHO_CABECALHO = 4;
export const LIMITE_MENSAGEM = 1024 * 1024;

function validarOrdemBytes(ordemBytes) {
  if (ordemBytes !== 'LE' && ordemBytes !== 'BE') {
    throw new Error('A ordem de bytes informada não é suportada.');
  }
}

function lerTamanho(cabecalho, ordemBytes) {
  validarOrdemBytes(ordemBytes);
  return ordemBytes === 'LE' ? cabecalho.readUInt32LE(0) : cabecalho.readUInt32BE(0);
}

function gravarTamanho(cabecalho, tamanho, ordemBytes) {
  validarOrdemBytes(ordemBytes);

  if (ordemBytes === 'LE') {
    cabecalho.writeUInt32LE(tamanho, 0);
    return;
  }

  cabecalho.writeUInt32BE(tamanho, 0);
}

function validarMensagemJson(mensagem) {
  if (mensagem === undefined || typeof mensagem === 'function' || typeof mensagem === 'symbol') {
    throw new TypeError('A mensagem não pode ser serializada como JSON.');
  }
}

export function serializarMensagem(mensagem, ordemBytes = os.endianness()) {
  validarMensagemJson(mensagem);

  const conteudo = Buffer.from(JSON.stringify(mensagem), 'utf8');

  if (conteudo.length > LIMITE_MENSAGEM) {
    throw new RangeError('A mensagem excede o limite de 1 MiB do host.');
  }

  const cabecalho = Buffer.alloc(TAMANHO_CABECALHO);
  gravarTamanho(cabecalho, conteudo.length, ordemBytes);

  return Buffer.concat([cabecalho, conteudo]);
}

export class DecodificadorMensagensNativas {
  #buffer = Buffer.alloc(0);
  #ordemBytes;
  #aoDecodificar;

  constructor(aoDecodificar, ordemBytes = os.endianness()) {
    if (typeof aoDecodificar !== 'function') {
      throw new TypeError('O callback de decodificação precisa ser uma função.');
    }

    validarOrdemBytes(ordemBytes);
    this.#aoDecodificar = aoDecodificar;
    this.#ordemBytes = ordemBytes;
  }

  receber(parte) {
    if (!Buffer.isBuffer(parte)) {
      throw new TypeError('O protocolo aceita somente blocos binários.');
    }

    this.#buffer = Buffer.concat([this.#buffer, parte]);
    this.#processarBuffer();
  }

  finalizar() {
    if (this.#buffer.length !== 0) {
      throw new Error('A entrada terminou com uma mensagem incompleta.');
    }
  }

  #processarBuffer() {
    while (this.#buffer.length >= TAMANHO_CABECALHO) {
      const tamanho = lerTamanho(this.#buffer.subarray(0, TAMANHO_CABECALHO), this.#ordemBytes);

      if (tamanho > LIMITE_MENSAGEM) {
        throw new RangeError('O tamanho declarado excede o limite de 1 MiB do host.');
      }

      const tamanhoTotal = TAMANHO_CABECALHO + tamanho;
      if (this.#buffer.length < tamanhoTotal) {
        return;
      }

      const conteudo = this.#buffer.subarray(TAMANHO_CABECALHO, tamanhoTotal);
      this.#buffer = this.#buffer.subarray(tamanhoTotal);

      let mensagem;
      try {
        mensagem = JSON.parse(conteudo.toString('utf8'));
      } catch {
        throw new SyntaxError('O conteúdo recebido não é um JSON válido.');
      }

      this.#aoDecodificar(mensagem);
    }
  }
}
