import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { ORIGEM_PERMITIDA, VERSAO_PROTOCOLO } from '../native-host/src/messages.mjs';
import { DecodificadorMensagensNativas, serializarMensagem } from '../native-host/src/protocol.mjs';

const caminhoHost = fileURLToPath(new URL('../native-host/src/host.mjs', import.meta.url));

function executarHost(entrada, argumentos = [ORIGEM_PERMITIDA]) {
  return new Promise((resolve, reject) => {
    const processo = spawn(process.execPath, [caminhoHost, ...argumentos], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const saida = [];
    const erros = [];

    processo.stdout.on('data', (parte) => saida.push(parte));
    processo.stderr.on('data', (parte) => erros.push(parte));
    processo.on('error', reject);
    processo.on('close', (codigo) => {
      resolve({
        codigo,
        saida: Buffer.concat(saida),
        erros: Buffer.concat(erros).toString('utf8'),
      });
    });

    if (entrada.length > 0) {
      processo.stdin.write(entrada);
    }
    processo.stdin.end();
  });
}

test('processo responde PONG e encerra com sucesso após EOF', async () => {
  const entrada = serializarMensagem({
    tipo: 'PING',
    idRequisicao: 'integracao-1',
    versaoProtocolo: VERSAO_PROTOCOLO,
  });
  const resultado = await executarHost(entrada);
  const mensagens = [];
  const decodificador = new DecodificadorMensagensNativas((mensagem) => mensagens.push(mensagem));

  decodificador.receber(resultado.saida);
  decodificador.finalizar();

  assert.equal(resultado.codigo, 0);
  assert.equal(resultado.erros, '');
  assert.deepEqual(mensagens, [
    {
      tipo: 'PONG',
      idRequisicao: 'integracao-1',
      versaoProtocolo: VERSAO_PROTOCOLO,
      versaoHost: '0.1.0',
    },
  ]);
});

test('processo rejeita mensagem sem operação permitida', async () => {
  const entrada = serializarMensagem({
    tipo: 'EXECUTAR',
    idRequisicao: 'integracao-2',
    versaoProtocolo: VERSAO_PROTOCOLO,
  });
  const resultado = await executarHost(entrada);

  assert.equal(resultado.codigo, 1);
  assert.equal(resultado.saida.length, 0);
  assert.match(resultado.erros, /Somente mensagens PING/);
});

test('processo rejeita origem diferente da extensão autorizada', async () => {
  const resultado = await executarHost(Buffer.alloc(0), [
    'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/',
  ]);

  assert.equal(resultado.codigo, 1);
  assert.equal(resultado.saida.length, 0);
  assert.match(resultado.erros, /origem chamadora não está autorizada/);
});

test('processo encerra normalmente quando recebe EOF sem mensagens', async () => {
  const resultado = await executarHost(Buffer.alloc(0));

  assert.equal(resultado.codigo, 0);
  assert.equal(resultado.saida.length, 0);
  assert.equal(resultado.erros, '');
});
