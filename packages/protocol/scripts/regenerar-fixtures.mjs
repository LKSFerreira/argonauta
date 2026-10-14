import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const diretorioExperimento = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const diretorioFixtures = resolve(diretorioExperimento, 'fixtures');

const definicoes = [
  {
    arquivo: 'ping-v1-windows-le.bin',
    mensagem: {
      tipo: 'PING',
      idRequisicao: 'fixture-ping-1',
      versaoProtocolo: '1.0'
    }
  },
  {
    arquivo: 'pong-v1-windows-le.bin',
    mensagem: {
      tipo: 'PONG',
      idRequisicao: 'fixture-ping-1',
      versaoProtocolo: '1.0',
      versaoHost: '0.1.0'
    }
  }
];

function criarEnquadramento(mensagem) {
  const json = JSON.stringify(mensagem);
  const payload = Buffer.from(json, 'utf8');
  const cabecalho = Buffer.alloc(4);
  cabecalho.writeUInt32LE(payload.length, 0);
  return {
    bytes: Buffer.concat([cabecalho, payload]),
    json,
    comprimentoPayload: payload.length
  };
}

await mkdir(diretorioFixtures, { recursive: true });
const manifesto = {
  versaoFixture: 1,
  protocolo: '1.0',
  codificacao: 'UTF-8',
  prefixo: 'uint32',
  ordemBytes: 'little-endian',
  origem: 'Valores fixos compatíveis com a implementação aprovada da POC-05A.',
  fixtures: []
};

for (const definicao of definicoes) {
  const enquadramento = criarEnquadramento(definicao.mensagem);
  await writeFile(resolve(diretorioFixtures, definicao.arquivo), enquadramento.bytes);
  manifesto.fixtures.push({
    arquivo: definicao.arquivo,
    mensagem: definicao.mensagem,
    json: enquadramento.json,
    comprimentoPayload: enquadramento.comprimentoPayload,
    comprimentoTotal: enquadramento.bytes.length,
    hexadecimal: enquadramento.bytes.toString('hex'),
    sha256: createHash('sha256').update(enquadramento.bytes).digest('hex')
  });
}

await writeFile(
  resolve(diretorioFixtures, 'manifesto.json'),
  `${JSON.stringify(manifesto, null, 2)}\n`,
  'utf8'
);
