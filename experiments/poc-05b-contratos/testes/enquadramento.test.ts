import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DecodificadorEnquadramento, serializarEnquadramento } from '../src/enquadramento.js';
import { ErroProtocolo, type CodigoErroProtocolo } from '../src/erros.js';

function esperarCodigo(codigo: CodigoErroProtocolo, operacao: () => unknown): void {
  assert.throws(operacao, (erro: unknown) => {
    assert.ok(erro instanceof ErroProtocolo);
    assert.equal(erro.codigo, codigo);
    return true;
  });
}

describe('enquadramento binário', () => {
  it('serializa e desserializa uma mensagem reversivelmente', () => {
    const mensagem = { texto: 'Olá, Argonauta 🚀', numero: 7 };
    const bytes = serializarEnquadramento(mensagem, 'LE');
    const decodificador = new DecodificadorEnquadramento('LE');

    assert.deepEqual(decodificador.adicionar(bytes), [mensagem]);
    decodificador.finalizar();
  });

  it('processa uma mensagem fragmentada byte a byte', () => {
    const mensagem = { tipo: 'TESTE', valor: 'fragmentado' };
    const bytes = serializarEnquadramento(mensagem, 'LE');
    const decodificador = new DecodificadorEnquadramento('LE');
    const recebidas: unknown[] = [];

    for (const byte of bytes) {
      recebidas.push(...decodificador.adicionar(Buffer.from([byte])));
    }

    decodificador.finalizar();
    assert.deepEqual(recebidas, [mensagem]);
  });

  it('processa mensagens concatenadas', () => {
    const primeira = { ordem: 1 };
    const segunda = { ordem: 2 };
    const lote = Buffer.concat([
      serializarEnquadramento(primeira, 'LE'),
      serializarEnquadramento(segunda, 'LE')
    ]);
    const decodificador = new DecodificadorEnquadramento('LE');

    assert.deepEqual(decodificador.adicionar(lote), [primeira, segunda]);
    decodificador.finalizar();
  });

  it('rejeita prefixo incompleto no encerramento', () => {
    const decodificador = new DecodificadorEnquadramento('LE');
    decodificador.adicionar(Buffer.from([1, 0, 0]));
    esperarCodigo('CABECALHO_INCOMPLETO', () => decodificador.finalizar());
  });

  it('rejeita prefixo zero e, portanto, payload vazio', () => {
    const decodificador = new DecodificadorEnquadramento('LE');
    esperarCodigo('PREFIXO_INVALIDO', () => decodificador.adicionar(Buffer.alloc(4)));
  });

  it('rejeita prefixo acima de 64 KiB', () => {
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32LE(65_537, 0);
    const decodificador = new DecodificadorEnquadramento('LE');
    esperarCodigo('TAMANHO_EXCEDIDO', () => decodificador.adicionar(cabecalho));
  });

  it('rejeita comprimento declarado maior que o payload disponível', () => {
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32LE(10, 0);
    const decodificador = new DecodificadorEnquadramento('LE');
    decodificador.adicionar(Buffer.concat([cabecalho, Buffer.from('{}')]));
    esperarCodigo('PAYLOAD_TRUNCADO', () => decodificador.finalizar());
  });

  it('rejeita comprimento declarado menor que o documento JSON', () => {
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32LE(1, 0);
    const decodificador = new DecodificadorEnquadramento('LE');
    esperarCodigo(
      'JSON_INVALIDO',
      () => decodificador.adicionar(Buffer.concat([cabecalho, Buffer.from('{}')]))
    );
  });

  it('rejeita payload truncado', () => {
    const bytes = serializarEnquadramento({ valor: true }, 'LE');
    const decodificador = new DecodificadorEnquadramento('LE');
    decodificador.adicionar(bytes.subarray(0, bytes.length - 1));
    esperarCodigo('PAYLOAD_TRUNCADO', () => decodificador.finalizar());
  });

  it('preserva UTF-8 multibyte válido', () => {
    const mensagem = { texto: 'ação, café e 🚀' };
    const decodificador = new DecodificadorEnquadramento('LE');
    const bytes = serializarEnquadramento(mensagem, 'LE');

    assert.deepEqual(decodificador.adicionar(bytes), [mensagem]);
  });

  it('rejeita sequência UTF-8 inválida', () => {
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32LE(2, 0);
    const decodificador = new DecodificadorEnquadramento('LE');
    esperarCodigo(
      'UTF8_INVALIDO',
      () => decodificador.adicionar(Buffer.concat([cabecalho, Buffer.from([0xc3, 0x28])]))
    );
  });

  it('rejeita documento JSON inválido', () => {
    const payload = Buffer.from('{invalido}', 'utf8');
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32LE(payload.length, 0);
    const decodificador = new DecodificadorEnquadramento('LE');
    esperarCodigo(
      'JSON_INVALIDO',
      () => decodificador.adicionar(Buffer.concat([cabecalho, payload]))
    );
  });

  it('rejeita serialização maior que 64 KiB sem mudar o limite legado', () => {
    esperarCodigo(
      'TAMANHO_EXCEDIDO',
      () => serializarEnquadramento({ dados: 'x'.repeat(65_536) }, 'LE')
    );
  });

  it('opera em big-endian quando solicitado explicitamente', () => {
    const mensagem = { ordem: 'BE' };
    const bytes = serializarEnquadramento(mensagem, 'BE');
    const decodificador = new DecodificadorEnquadramento('BE');

    assert.equal(bytes.readUInt32BE(0), bytes.length - 4);
    assert.deepEqual(decodificador.adicionar(bytes), [mensagem]);
  });
});
