import assert from 'node:assert/strict';
import os from 'node:os';
import test from 'node:test';

import { processarMensagem, VERSAO_HOST, VERSAO_PROTOCOLO } from '../native-host/src/mensagens.mjs';
import {
  DecodificadorMensagensNativas,
  LIMITE_MENSAGEM,
  serializarMensagem,
} from '../native-host/src/protocolo.mjs';

test('serializa JSON UTF-8 com tamanho binário correto', () => {
  const mensagem = { texto: 'Olá, Argonauta!' };
  const serializada = serializarMensagem(mensagem);
  const tamanho = os.endianness() === 'LE' ? serializada.readUInt32LE(0) : serializada.readUInt32BE(0);

  assert.equal(tamanho, Buffer.byteLength(JSON.stringify(mensagem), 'utf8'));
  assert.deepEqual(JSON.parse(serializada.subarray(4).toString('utf8')), mensagem);
});

test('desserializa mensagens fragmentadas e concatenadas', () => {
  const mensagens = [];
  const decodificador = new DecodificadorMensagensNativas((mensagem) => mensagens.push(mensagem));
  const entrada = Buffer.concat([
    serializarMensagem({ sequencia: 1 }),
    serializarMensagem({ sequencia: 2 }),
  ]);

  decodificador.receber(entrada.subarray(0, 3));
  decodificador.receber(entrada.subarray(3, 11));
  decodificador.receber(entrada.subarray(11));
  decodificador.finalizar();

  assert.deepEqual(mensagens, [{ sequencia: 1 }, { sequencia: 2 }]);
});

test('rejeita conteúdo JSON inválido', () => {
  const conteudo = Buffer.from('{invalido', 'utf8');
  const cabecalho = Buffer.alloc(4);
  os.endianness() === 'LE'
    ? cabecalho.writeUInt32LE(conteudo.length)
    : cabecalho.writeUInt32BE(conteudo.length);
  const decodificador = new DecodificadorMensagensNativas(() => {});

  assert.throws(
    () => decodificador.receber(Buffer.concat([cabecalho, conteudo])),
    /não é um JSON válido/,
  );
});

test('rejeita tamanho declarado acima do limite', () => {
  const cabecalho = Buffer.alloc(4);
  os.endianness() === 'LE'
    ? cabecalho.writeUInt32LE(LIMITE_MENSAGEM + 1)
    : cabecalho.writeUInt32BE(LIMITE_MENSAGEM + 1);
  const decodificador = new DecodificadorMensagensNativas(() => {});

  assert.throws(() => decodificador.receber(cabecalho), /excede o limite/);
});

test('detecta encerramento com mensagem incompleta', () => {
  const decodificador = new DecodificadorMensagensNativas(() => {});
  decodificador.receber(Buffer.from([10, 0, 0, 0, 123]));

  assert.throws(() => decodificador.finalizar(), /mensagem incompleta/);
});

test('converte PING válido em PONG versionado', () => {
  const resposta = processarMensagem({
    tipo: 'PING',
    idRequisicao: 'requisicao-1',
    versaoProtocolo: VERSAO_PROTOCOLO,
  });

  assert.deepEqual(resposta, {
    tipo: 'PONG',
    idRequisicao: 'requisicao-1',
    versaoProtocolo: VERSAO_PROTOCOLO,
    versaoHost: VERSAO_HOST,
  });
});

test('rejeita mensagens que não sejam PING', () => {
  assert.throws(
    () =>
      processarMensagem({
        tipo: 'EXECUTAR',
        idRequisicao: 'requisicao-2',
        versaoProtocolo: VERSAO_PROTOCOLO,
      }),
    /Somente mensagens PING/,
  );
});
