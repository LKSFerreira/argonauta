import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CHAVE_TEMPORARIA,
  verificarArmazenamentoSeguro,
  type ArmazenamentoSeguro,
  type RegistrarDiagnostico,
} from '../src/secure-storage';

function criarRegistrador(eventos: string[]): RegistrarDiagnostico {
  return (identificador, evento) => eventos.push(`${identificador}:${evento}`);
}

describe('armazenamento seguro temporário', () => {
  it('grava, lê e remove o valor temporário', async () => {
    const valores = new Map<string, string>();
    const eventos: string[] = [];
    const armazenamento: ArmazenamentoSeguro = {
      async store(chave, valor) {
        valores.set(chave, valor);
      },
      async get(chave) {
        return valores.get(chave);
      },
      async delete(chave) {
        valores.delete(chave);
      },
    };

    const resultado = await verificarArmazenamentoSeguro(armazenamento, {
      limiteMilissegundos: 100,
      criarValorTemporario: () => 'valor-temporario',
      registrar: criarRegistrador(eventos),
    });

    assert.equal(resultado.estado, 'pass');
    assert.equal(valores.has(CHAVE_TEMPORARIA), false);
    assert.ok(eventos.includes('SEC-20-STORE:PASS'));
    assert.ok(eventos.includes('SEC-30-GET:PASS'));
    assert.ok(eventos.includes('SEC-40-LIMPEZA-FINAL:LIMPEZA'));
  });

  it('classifica timeout de store como fail e executa limpeza imediata', async () => {
    const valores = new Map<string, string>();
    const eventos: string[] = [];
    const armazenamento: ArmazenamentoSeguro = {
      store(chave, valor) {
        valores.set(chave, valor);
        return new Promise<void>(() => undefined);
      },
      async get(chave) {
        return valores.get(chave);
      },
      async delete(chave) {
        valores.delete(chave);
      },
    };

    const resultado = await verificarArmazenamentoSeguro(armazenamento, {
      limiteMilissegundos: 20,
      criarValorTemporario: () => 'valor-temporario',
      registrar: criarRegistrador(eventos),
    });

    assert.equal(resultado.estado, 'fail');
    assert.equal(valores.has(CHAVE_TEMPORARIA), false);
    assert.ok(eventos.includes('SEC-20-STORE:TIMEOUT'));
  });

  it('remove um valor gravado depois do timeout quando store finalmente conclui', async () => {
    const valores = new Map<string, string>();
    const armazenamento: ArmazenamentoSeguro = {
      store(chave, valor) {
        return new Promise<void>((resolver) => {
          setTimeout(() => {
            valores.set(chave, valor);
            resolver();
          }, 40);
        });
      },
      async get(chave) {
        return valores.get(chave);
      },
      async delete(chave) {
        valores.delete(chave);
      },
    };

    const resultado = await verificarArmazenamentoSeguro(armazenamento, {
      limiteMilissegundos: 10,
      criarValorTemporario: () => 'valor-temporario',
      registrar: () => undefined,
    });

    await new Promise<void>((resolver) => setTimeout(resolver, 80));

    assert.equal(resultado.estado, 'fail');
    assert.equal(valores.has(CHAVE_TEMPORARIA), false);
  });

  it('não inicia store quando o cancelamento já foi solicitado', async () => {
    const controlador = new AbortController();
    let quantidadeArmazenamentos = 0;
    const armazenamento: ArmazenamentoSeguro = {
      async store() {
        quantidadeArmazenamentos += 1;
      },
      async get() {
        return undefined;
      },
      async delete() {},
    };
    controlador.abort();

    const resultado = await verificarArmazenamentoSeguro(armazenamento, {
      limiteMilissegundos: 100,
      sinalCancelamento: controlador.signal,
      criarValorTemporario: () => 'valor-temporario',
      registrar: () => undefined,
    });

    assert.equal(resultado.estado, 'fail');
    assert.equal(quantidadeArmazenamentos, 0);
  });
});
