import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  criarRelatorio,
  formatarRelatorio,
  validarAusenciaDeDadosSensiveis,
  type AmbienteCompatibilidade,
} from '../src/relatorio';

const AMBIENTE_SEGURO: AmbienteCompatibilidade = {
  nomeIde: 'Antigravity IDE',
  versaoIdeApi: '1.107.0',
  compatibilidadeApiDeclarada: '^1.85.0',
  versaoRuntimeNode: 'v22.20.0',
  tipoInterface: 'desktop',
  execucaoRemota: false,
};

describe('relatório de compatibilidade', () => {
  it('calcula o resumo e formata somente evidências permitidas', () => {
    const relatorio = criarRelatorio(AMBIENTE_SEGURO, [
      { verificacao: 'A', estado: 'pass', evidencia: 'Disponível.' },
      { verificacao: 'B', estado: 'fail', evidencia: 'Falhou.' },
      { verificacao: 'C', estado: 'unsupported', evidencia: 'Ausente.' },
    ]);
    const texto = formatarRelatorio(relatorio);

    assert.deepEqual(relatorio.resumo, { pass: 1, fail: 1, unsupported: 1 });
    assert.match(texto, /IDE: Antigravity IDE/u);
    assert.match(texto, /pass=1, fail=1, unsupported=1/u);
    assert.doesNotThrow(() => validarAusenciaDeDadosSensiveis(texto));
  });

  it('bloqueia caminhos pessoais e caminhos de rede', () => {
    assert.throws(
      () => validarAusenciaDeDadosSensiveis('C:\\Users\\pessoa\\arquivo.txt'),
      /caminho pessoal ou de rede/u,
    );
    assert.throws(
      () => validarAusenciaDeDadosSensiveis('\\\\servidor\\compartilhamento'),
      /caminho pessoal ou de rede/u,
    );
    assert.throws(
      () => validarAusenciaDeDadosSensiveis('C:\\Users\\pessoa\\arquivo.txt'),
      /caminho pessoal ou de rede/u,
    );
  });
});
