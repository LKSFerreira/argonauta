import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';

import { DecodificadorEnquadramento, serializarEnquadramento } from '@argonauta/protocol';

interface RegistroFixture {
  readonly arquivo: string;
  readonly mensagem: Readonly<Record<string, unknown>>;
  readonly json: string;
  readonly comprimentoPayload: number;
  readonly comprimentoTotal: number;
  readonly hexadecimal: string;
  readonly sha256: string;
}

interface ManifestoFixtures {
  readonly versaoFixture: number;
  readonly protocolo: string;
  readonly codificacao: string;
  readonly prefixo: string;
  readonly ordemBytes: string;
  readonly fixtures: readonly RegistroFixture[];
}

interface ModuloProtocoloPoc05A {
  readonly serializarMensagem: (mensagem: unknown, ordem: 'LE' | 'BE') => Buffer;
  readonly DecodificadorMensagensNativas: new (
    aoDecodificar: (mensagem: unknown) => void,
    ordem: 'LE' | 'BE'
  ) => {
    receber(parte: Buffer): void;
    finalizar(): void;
  };
}

interface ModuloMensagensPoc05A {
  readonly processarMensagem: (mensagem: unknown) => unknown;
}

const exigir = createRequire(import.meta.url);
const diretorioPacoteProtocolo = dirname(exigir.resolve('@argonauta/protocol/package.json'));
const diretorioFixtures = resolve(diretorioPacoteProtocolo, 'fixtures');
const IDENTIDADE_FIXTURES = {
  'ping-v1-windows-le.bin': {
    comprimentoPayload: 71,
    comprimentoTotal: 75,
    sha256: '414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd'
  },
  'pong-v1-windows-le.bin': {
    comprimentoPayload: 92,
    comprimentoTotal: 96,
    sha256: '4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392'
  }
} as const;

function ehModuloPoc05A(valor: unknown): valor is ModuloProtocoloPoc05A {
  if (valor === null || typeof valor !== 'object') {
    return false;
  }

  const modulo = valor as Record<string, unknown>;
  return typeof modulo.serializarMensagem === 'function'
    && typeof modulo.DecodificadorMensagensNativas === 'function';
}

function ehModuloMensagensPoc05A(valor: unknown): valor is ModuloMensagensPoc05A {
  return valor !== null
    && typeof valor === 'object'
    && typeof (valor as Record<string, unknown>).processarMensagem === 'function';
}

async function carregarManifesto(): Promise<ManifestoFixtures> {
  const conteudo = await readFile(resolve(diretorioFixtures, 'manifesto.json'), 'utf8');
  return JSON.parse(conteudo) as ManifestoFixtures;
}

async function carregarModuloPoc05A(): Promise<ModuloProtocoloPoc05A> {
  const moduloDesconhecido: unknown = await import('@argonauta/native-messaging-smoke/protocol');
  assert.ok(ehModuloPoc05A(moduloDesconhecido), 'A API aprovada da POC-05A mudou.');
  return moduloDesconhecido;
}

async function carregarMensagensPoc05A(): Promise<ModuloMensagensPoc05A> {
  const moduloDesconhecido: unknown = await import('@argonauta/native-messaging-smoke/messages');
  assert.ok(ehModuloMensagensPoc05A(moduloDesconhecido), 'O processador da POC-05A mudou.');
  return moduloDesconhecido;
}

describe('compatibilidade binária PING/PONG 1.0', () => {
  it('mantém metadados estáveis e explícitos das fixtures', async () => {
    const manifesto = await carregarManifesto();

    assert.equal(manifesto.versaoFixture, 1);
    assert.equal(manifesto.protocolo, '1.0');
    assert.equal(manifesto.codificacao, 'UTF-8');
    assert.equal(manifesto.prefixo, 'uint32');
    assert.equal(manifesto.ordemBytes, 'little-endian');
    assert.equal(manifesto.fixtures.length, 2);
  });

  it('confere bytes, comprimentos, hexadecimal e SHA-256 das fixtures', async () => {
    const manifesto = await carregarManifesto();

    for (const fixture of manifesto.fixtures) {
      assert.ok(fixture.arquivo in IDENTIDADE_FIXTURES, 'Fixture não aprovada no contrato.');
      const identidade = IDENTIDADE_FIXTURES[
        fixture.arquivo as keyof typeof IDENTIDADE_FIXTURES
      ];
      const bytes = await readFile(resolve(diretorioFixtures, fixture.arquivo));
      const payload = bytes.subarray(4);

      assert.equal(fixture.comprimentoPayload, identidade.comprimentoPayload);
      assert.equal(fixture.comprimentoTotal, identidade.comprimentoTotal);
      assert.equal(fixture.sha256, identidade.sha256);
      assert.equal(bytes.readUInt32LE(0), fixture.comprimentoPayload);
      assert.equal(bytes.length, fixture.comprimentoTotal);
      assert.equal(payload.toString('utf8'), fixture.json);
      assert.equal(bytes.toString('hex'), fixture.hexadecimal);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), fixture.sha256);
    }
  });

  it('é idêntico byte a byte ao serializador real e intacto da POC-05A', async () => {
    const manifesto = await carregarManifesto();
    const protocoloPoc05A = await carregarModuloPoc05A();

    for (const fixture of manifesto.fixtures) {
      const esperado = await readFile(resolve(diretorioFixtures, fixture.arquivo));
      const atual = protocoloPoc05A.serializarMensagem(fixture.mensagem, 'LE');
      assert.deepEqual(atual, esperado);
    }
  });

  it('é idêntico byte a byte ao serializador isolado da POC-05B', async () => {
    const manifesto = await carregarManifesto();

    for (const fixture of manifesto.fixtures) {
      const esperado = await readFile(resolve(diretorioFixtures, fixture.arquivo));
      const atual = serializarEnquadramento(fixture.mensagem, 'LE');
      assert.deepEqual(atual, esperado);
    }
  });

  it('é decodificado pela implementação real da POC-05A', async () => {
    const manifesto = await carregarManifesto();
    const protocoloPoc05A = await carregarModuloPoc05A();

    for (const fixture of manifesto.fixtures) {
      const recebidas: unknown[] = [];
      const decodificador = new protocoloPoc05A.DecodificadorMensagensNativas(
        (mensagem) => recebidas.push(mensagem),
        'LE'
      );
      decodificador.receber(await readFile(resolve(diretorioFixtures, fixture.arquivo)));
      decodificador.finalizar();
      assert.deepEqual(recebidas, [fixture.mensagem]);
    }
  });

  it('mantém a transformação real de PING em PONG da POC-05A', async () => {
    const manifesto = await carregarManifesto();
    const mensagensPoc05A = await carregarMensagensPoc05A();
    const ping = manifesto.fixtures.find((fixture) => fixture.mensagem.tipo === 'PING');
    const pong = manifesto.fixtures.find((fixture) => fixture.mensagem.tipo === 'PONG');

    assert.ok(ping);
    assert.ok(pong);
    assert.deepEqual(mensagensPoc05A.processarMensagem(ping.mensagem), pong.mensagem);
  });

  it('é decodificado pela camada isolada da POC-05B', async () => {
    const manifesto = await carregarManifesto();

    for (const fixture of manifesto.fixtures) {
      const decodificador = new DecodificadorEnquadramento('LE');
      const recebidas = decodificador.adicionar(
        await readFile(resolve(diretorioFixtures, fixture.arquivo))
      );
      decodificador.finalizar();
      assert.deepEqual(recebidas, [fixture.mensagem]);
    }
  });
});
