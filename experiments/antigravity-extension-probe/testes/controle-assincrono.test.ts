import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ErroCancelamento,
  ErroTempoLimite,
  executarComLimiteTempo,
} from '../src/controle-assincrono';

describe('controle assíncrono', () => {
  it('conclui uma operação dentro do limite', async () => {
    const resultado = await executarComLimiteTempo('TESTE-01', 100, async () => 'ok');

    assert.equal(resultado, 'ok');
  });

  it('interrompe a espera por uma Promise que nunca conclui', async () => {
    const promessaPendente = new Promise<void>(() => undefined);

    await assert.rejects(
      executarComLimiteTempo('TESTE-02', 20, () => promessaPendente),
      ErroTempoLimite,
    );
  });

  it('reage ao cancelamento sem aguardar o timeout', async () => {
    const controlador = new AbortController();
    const promessaPendente = new Promise<void>(() => undefined);
    const execucao = executarComLimiteTempo(
      'TESTE-03',
      1_000,
      () => promessaPendente,
      controlador.signal,
    );

    controlador.abort();

    await assert.rejects(execucao, ErroCancelamento);
  });
});
