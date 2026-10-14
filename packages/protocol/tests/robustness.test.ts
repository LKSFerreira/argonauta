import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ErroProtocolo } from '../src/errors.js';
import { LIMITE_PROFUNDIDADE_JSON } from '../src/json-structure.js';
import { validarMensagem } from '../src/validation.js';

const MENSAGEM_VALIDA = {
  tipo: 'DESAFIO_AUTENTICACAO',
  idRequisicao: 'requisicao-imutavel',
  versaoProtocolo: '1.0',
  nonceHost: 'abcdefghijklmnopqrstuv',
  instanteHost: '2026-10-14T12:00:00.000Z'
} as const;

describe('robustez da validação', () => {
  it('não altera a entrada durante a validação', () => {
    const congelada = Object.freeze({ ...MENSAGEM_VALIDA });
    const antes = JSON.stringify(congelada);

    const resultado = validarMensagem(congelada);

    assert.equal(JSON.stringify(congelada), antes);
    assert.equal(resultado, congelada);
  });

  it('produz o mesmo código para a mesma falha', () => {
    const codigos: string[] = [];
    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      try {
        validarMensagem({ ...MENSAGEM_VALIDA, versaoProtocolo: '9.9' });
      } catch (erro: unknown) {
        assert.ok(erro instanceof ErroProtocolo);
        codigos.push(erro.codigo);
      }
    }

    assert.deepEqual(codigos, [
      'VERSAO_INCOMPATIVEL',
      'VERSAO_INCOMPATIVEL',
      'VERSAO_INCOMPATIVEL'
    ]);
  });

  it('não inclui o conteúdo sensível rejeitado no erro', () => {
    const segredo = 'token-super-secreto-que-nao-pode-vazar';

    assert.throws(
      () => validarMensagem({ ...MENSAGEM_VALIDA, segredo }),
      (erro: unknown) => {
        assert.ok(erro instanceof ErroProtocolo);
        assert.equal(erro.codigo, 'CAMPO_NAO_PERMITIDO');
        assert.doesNotMatch(erro.message, new RegExp(segredo, 'u'));
        assert.doesNotMatch(erro.stack ?? '', new RegExp(segredo, 'u'));
        return true;
      }
    );
  });

  it('rejeita objeto com getter sem interpretar o valor como contrato', () => {
    let leituras = 0;
    const entrada = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(entrada, 'tipo', {
      enumerable: true,
      get: () => {
        leituras += 1;
        return 'DESAFIO_AUTENTICACAO';
      }
    });

    assert.throws(() => validarMensagem(entrada), ErroProtocolo);
    assert.equal(leituras, 0);
  });

  it('rejeita referência circular com código previsível', () => {
    const circular: Record<string, unknown> = { tipo: 'DESAFIO_AUTENTICACAO' };
    circular.autorreferencia = circular;

    assert.throws(
      () => validarMensagem(circular),
      (erro: unknown) => erro instanceof ErroProtocolo && erro.codigo === 'JSON_INVALIDO'
    );
  });

  it('rejeita objetos e arrays excessivamente profundos sem RangeError', () => {
    let objetoProfundo: unknown = { folha: true };
    let arrayProfundo: unknown = ['folha'];
    for (let nivel = 0; nivel <= LIMITE_PROFUNDIDADE_JSON; nivel += 1) {
      objetoProfundo = { proximo: objetoProfundo };
      arrayProfundo = [arrayProfundo];
    }

    for (const entrada of [objetoProfundo, arrayProfundo]) {
      assert.throws(
        () => validarMensagem({ ...MENSAGEM_VALIDA, estruturaExcessiva: entrada }),
        (erro: unknown) => {
          assert.ok(erro instanceof ErroProtocolo);
          assert.equal(erro.codigo, 'PROFUNDIDADE_EXCEDIDA');
          assert.ok(!(erro instanceof RangeError));
          return true;
        }
      );
    }
  });
});
