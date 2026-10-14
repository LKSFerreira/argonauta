import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const FIXTURES = Object.freeze({
  'packages/protocol/fixtures/ping-v1-windows-le.bin':
    '414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd',
  'packages/protocol/fixtures/pong-v1-windows-le.bin':
    '4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392'
});

for (const [caminho, hashEsperado] of Object.entries(FIXTURES)) {
  const conteudo = await readFile(caminho);
  const hashAtual = createHash('sha256').update(conteudo).digest('hex');
  assert.equal(hashAtual, hashEsperado, `A fixture congelada foi alterada: ${caminho}`);
}

process.stdout.write('Fixtures PING/PONG verificadas com sucesso.\n');
