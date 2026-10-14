import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

interface ManifestoExtensao {
  readonly activationEvents?: readonly string[];
  readonly extensionKind?: readonly string[];
  readonly contributes?: {
    readonly commands?: readonly {
      readonly command?: string;
      readonly title?: string;
      readonly category?: string;
    }[];
  };
}

async function lerManifesto(): Promise<ManifestoExtensao> {
  const caminhoManifesto = resolve(__dirname, '..', '..', 'package.json');
  return JSON.parse(await readFile(caminhoManifesto, 'utf8')) as ManifestoExtensao;
}

describe('manifesto da extensão', () => {
  it('declara execução local com extensionKind ui', async () => {
    const manifesto = await lerManifesto();

    assert.deepEqual(manifesto.extensionKind, ['ui']);
  });

  it('registra somente o comando autorizado', async () => {
    const manifesto = await lerManifesto();

    assert.deepEqual(manifesto.activationEvents, [
      'onCommand:argonauta.verificarCompatibilidade',
    ]);
    assert.deepEqual(manifesto.contributes?.commands, [
      {
        command: 'argonauta.verificarCompatibilidade',
        title: 'Check Compatibility',
        category: 'Argonauta',
      },
    ]);
  });
});
