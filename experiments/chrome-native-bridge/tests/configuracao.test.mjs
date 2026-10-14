import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { ORIGEM_PERMITIDA } from '../native-host/src/mensagens.mjs';

const caminhoManifestoExtensao = new URL('../extension/manifest.json', import.meta.url);
const caminhoManifestoHost = new URL(
  '../native-host/windows/com.argonauta.poc05a.json',
  import.meta.url,
);

async function lerJson(caminho) {
  return JSON.parse(await readFile(caminho, 'utf8'));
}

function calcularIdExtensao(chavePublica) {
  const resumo = createHash('sha256').update(Buffer.from(chavePublica, 'base64')).digest();

  return [...resumo.subarray(0, 16)]
    .flatMap((byte) => [byte >> 4, byte & 15])
    .map((valor) => String.fromCharCode('a'.charCodeAt(0) + valor))
    .join('');
}

test('manifesto MV3 solicita somente nativeMessaging', async () => {
  const manifesto = await lerJson(caminhoManifestoExtensao);

  assert.equal(manifesto.manifest_version, 3);
  assert.deepEqual(manifesto.permissions, ['nativeMessaging']);
  assert.equal('host_permissions' in manifesto, false);
  assert.equal('content_scripts' in manifesto, false);
});

test('chave pública produz o ID autorizado pelo host', async () => {
  const manifestoExtensao = await lerJson(caminhoManifestoExtensao);
  const manifestoHost = await lerJson(caminhoManifestoHost);
  const idExtensao = calcularIdExtensao(manifestoExtensao.key);

  assert.equal(idExtensao, 'kmhnfligldbfbjmdmodckpmbnfmehfba');
  assert.deepEqual(manifestoHost.allowed_origins, [`chrome-extension://${idExtensao}/`]);
  assert.equal(ORIGEM_PERMITIDA, manifestoHost.allowed_origins[0]);
});
