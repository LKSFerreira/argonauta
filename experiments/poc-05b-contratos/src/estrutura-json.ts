import { types as tiposUtil } from 'node:util';

import { falhar } from './erros.js';

export const LIMITE_PROFUNDIDADE_JSON = 64;

type ItemPendente =
  | {
    readonly tipo: 'entrada';
    readonly valor: unknown;
    readonly profundidade: number;
  }
  | {
    readonly tipo: 'saida';
    readonly objeto: object;
  };

function ehPrimitivoJson(valor: unknown): boolean {
  return valor === null || ['string', 'number', 'boolean'].includes(typeof valor);
}

export function validarEstruturaJsonPassiva(
  valor: unknown,
  limiteProfundidade = LIMITE_PROFUNDIDADE_JSON
): void {
  const ancestrais = new WeakSet<object>();
  const pendentes: ItemPendente[] = [{ tipo: 'entrada', valor, profundidade: 0 }];

  while (pendentes.length > 0) {
    const item = pendentes.pop();
    if (item === undefined) {
      break;
    }

    if (item.tipo === 'saida') {
      ancestrais.delete(item.objeto);
      continue;
    }

    if (item.profundidade > limiteProfundidade) {
      falhar('PROFUNDIDADE_EXCEDIDA');
    }

    if (ehPrimitivoJson(item.valor)) {
      continue;
    }

    if (typeof item.valor !== 'object') {
      falhar('MENSAGEM_INVALIDA');
    }

    const objeto = item.valor as object;
    if (tiposUtil.isProxy(objeto)) {
      falhar('MENSAGEM_INVALIDA');
    }

    if (ancestrais.has(objeto)) {
      falhar('JSON_INVALIDO');
    }

    const ehArray = Array.isArray(objeto);
    const prototipo = Object.getPrototypeOf(objeto) as unknown;
    const prototipoPermitido = ehArray
      ? prototipo === Array.prototype
      : prototipo === Object.prototype || prototipo === null;
    if (!prototipoPermitido) {
      falhar('MENSAGEM_INVALIDA');
    }

    ancestrais.add(objeto);
    pendentes.push({ tipo: 'saida', objeto });

    const chaves = Reflect.ownKeys(objeto);
    for (let indice = chaves.length - 1; indice >= 0; indice -= 1) {
      const chave = chaves[indice];
      if (chave === undefined) {
        continue;
      }

      if (typeof chave === 'symbol') {
        falhar('MENSAGEM_INVALIDA');
      }

      const descritor = Object.getOwnPropertyDescriptor(objeto, chave);
      if (descritor === undefined) {
        falhar('MENSAGEM_INVALIDA');
      }

      if (descritor.get !== undefined || descritor.set !== undefined) {
        falhar('MENSAGEM_INVALIDA');
      }

      const ehComprimentoArray = ehArray && chave === 'length';
      if (!descritor.enumerable && !ehComprimentoArray) {
        falhar('MENSAGEM_INVALIDA');
      }

      if (!ehComprimentoArray) {
        pendentes.push({
          tipo: 'entrada',
          valor: descritor.value,
          profundidade: item.profundidade + 1
        });
      }
    }
  }
}
