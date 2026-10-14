import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const pastaTestes = dirname(fileURLToPath(import.meta.url));
const pastaProjeto = dirname(pastaTestes);
const executavel = join(pastaProjeto, 'build', 'ipc-security-probe.exe');
const executavelTesteIo = join(pastaProjeto, 'build', 'classificacao-io.test.exe');
const cliente = join(pastaProjeto, 'client', 'diagnostic-client.mjs');
const squatter = join(pastaTestes, 'squatter.mjs');
const TEMPO_TESTE = 8_000;

function aguardarLinhaJson(processo, predicado, tempoLimiteMs = TEMPO_TESTE) {
  return new Promise((resolve, reject) => {
    let pendente = '';
    const temporizador = setTimeout(() => {
      limpar();
      reject(new Error('Tempo esgotado aguardando evento JSON do processo diagnóstico.'));
    }, tempoLimiteMs);

    function limpar() {
      clearTimeout(temporizador);
      processo.stdout.off('data', aoReceber);
      processo.off('exit', aoSair);
    }

    function aoSair(codigo) {
      limpar();
      reject(new Error(`O processo terminou com código ${codigo} antes do evento esperado.`));
    }

    function aoReceber(fragmento) {
      pendente += fragmento.toString('utf8');
      const linhas = pendente.split(/\r?\n/u);
      pendente = linhas.pop() ?? '';
      for (const linha of linhas) {
        if (!linha.trim()) {
          continue;
        }
        const evento = JSON.parse(linha);
        if (predicado(evento)) {
          limpar();
          resolve(evento);
          return;
        }
      }
    }

    processo.stdout.on('data', aoReceber);
    processo.once('exit', aoSair);
  });
}

function aguardarSaida(processo, tempoLimiteMs = TEMPO_TESTE) {
  return new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    const temporizador = setTimeout(() => {
      processo.kill();
      reject(new Error('O processo diagnóstico não encerrou no limite do teste.'));
    }, tempoLimiteMs);

    processo.stdout.on('data', (fragmento) => stdout.push(fragmento));
    processo.stderr.on('data', (fragmento) => stderr.push(fragmento));
    processo.once('error', (erro) => {
      clearTimeout(temporizador);
      reject(erro);
    });
    processo.once('exit', (codigo, sinal) => {
      clearTimeout(temporizador);
      resolve({
        codigo,
        sinal,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
  });
}

function iniciarHelper({ politica = 'estrita', mascara, sufixo, timeout = 1_000 } = {}) {
  const argumentos = mascara
    ? ['--mascara-hex', mascara, '--timeout-ms', String(timeout)]
    : ['--politica', politica, '--timeout-ms', String(timeout)];
  if (sufixo) {
    argumentos.push('--sufixo', sufixo);
  }
  const processo = spawn(executavel, argumentos, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { processo, saida: aguardarSaida(processo) };
}

async function executarCliente(caminhoPipe, modo = 'valido') {
  const processo = spawn(process.execPath, [cliente, caminhoPipe, modo], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const saida = await aguardarSaida(processo);
  assert.equal(saida.codigo, 0, saida.stderr);
  return JSON.parse(saida.stdout);
}

function caminhoLocalhost(caminhoLocal) {
  return caminhoLocal.replace(/^\\\\\.\\pipe\\/u, '\\\\localhost\\pipe\\');
}

async function iniciarEObterProntidao(opcoes) {
  const helper = iniciarHelper(opcoes);
  const prontidao = await aguardarLinhaJson(
    helper.processo,
    (evento) => evento.evento === 'PRONTO_DIAGNOSTICO',
  );
  return { helper: helper.processo, saidaHelper: helper.saida, prontidao };
}

if (process.platform !== 'win32') {
  test('probe Win32 indisponível fora do Windows', { skip: true }, () => {});
} else {
  const cenariosClassificacaoIo = [
    'conclusao_antes_timeout',
    'conclusao_apos_timeout',
    'conclusao_zero_byte_apos_timeout',
    'cancelamento_confirmado',
    'desconexao_apos_timeout',
    'desconexao_sem_timeout',
    'falha_apos_timeout',
    'cancelamento_inesperado',
    'desconexao_no_data_apos_timeout',
  ];

  for (const cenario of cenariosClassificacaoIo) {
    test(`I/O Win32: classifica ${cenario} sem perder a conclusão real`, async () => {
      const processo = spawn(executavelTesteIo, [cenario], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const saida = await aguardarSaida(processo);
      assert.equal(saida.codigo, 0, saida.stderr);
    });
  }

  test('M01–M06: cria e inspeciona o primeiro handle com política explícita', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao();

    assert.equal(prontidao.descritorAntesDaCriacao, true);
    assert.equal(prontidao.daclPresente, true);
    assert.equal(prontidao.daclNaoNula, true);
    assert.equal(prontidao.daclProtegida, true);
    assert.equal(prontidao.quantidadeAces, 1);
    assert.equal(prontidao.aceSidLogon, true);
    assert.equal(prontidao.semPrincipaisProibidos, true);
    assert.equal(prontidao.handleNaoHerdavel, true);
    assert.equal(prontidao.proprietarioConformePolitica, true);
    assert.equal(prontidao.grupoConformePolitica, true);
    assert.equal(prontidao.mascara, '0x0010019B');
    assert.equal(prontidao.incluiFileCreatePipeInstance, false);
    assert.equal(prontidao.estadoGate, 'em_medicao');

    const clienteValido = await executarCliente(prontidao.caminhoPipe);
    assert.equal(clienteValido.respostaPong, true);
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 0);
  });

  test('M05: mede o conflito entre máscara estrita e cliente node:net', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao({
      politica: 'compatibilidade-node',
    });
    assert.equal(prontidao.mascara, '0x0012019F');
    assert.equal(prontidao.incluiFileCreatePipeInstance, true);

    const resultadoCliente = await executarCliente(prontidao.caminhoPipe);
    assert.equal(resultadoCliente.respostaPong, true);

    const saida = await saidaHelper;
    assert.equal(saida.codigo, 2);
    assert.match(saida.stdout, /"atendimento":"sucesso"/u);
    assert.match(saida.stdout, /"estado":"blocked"/u);
  });

  test('M05: comprova cada direito da máscara estrita exigido pelo cliente Node', async () => {
    const mascaraEstrita = 0x0010019B;
    const direitosIndividuais = [
      0x00000001,
      0x00000002,
      0x00000008,
      0x00000010,
      0x00000080,
      0x00000100,
      0x00100000,
    ];

    for (const direito of direitosIndividuais) {
      const mascara = `0x${(mascaraEstrita & ~direito).toString(16).padStart(8, '0')}`;
      const { prontidao, saidaHelper } = await iniciarEObterProntidao({ mascara, timeout: 300 });
      assert.equal(prontidao.incluiFileCreatePipeInstance, false);
      const resultadoCliente = await executarCliente(prontidao.caminhoPipe);
      assert.equal(resultadoCliente.estado, 'rejeitado');
      assert.equal(resultadoCliente.respostaPong, false);
      const saida = await saidaHelper;
      assert.equal(saida.codigo, 3);
    }
  });

  test('M07: cliente Node independente completa PING_GATE/PONG_GATE somente após autorização', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao();
    const resultadoCliente = await executarCliente(prontidao.caminhoPipe);
    assert.deepEqual(resultadoCliente, {
      estado: 'encerrado',
      respostaPong: true,
      bytesResposta: 9,
    });

    const saida = await saidaHelper;
    assert.equal(saida.codigo, 0);
    assert.match(saida.stdout, /"mensagemLidaAntesDaRepresentacao":true/u);
    assert.match(saida.stdout, /"clienteAutorizado":true/u);
    assert.match(saida.stdout, /"respostaEnviada":true/u);
  });

  test('M07: preserva a troca quando o frame diagnóstico chega fragmentado', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao();
    const resultadoCliente = await executarCliente(prontidao.caminhoPipe, 'fragmentado');
    assert.equal(resultadoCliente.respostaPong, true);
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 0);
  });

  test('M08: PIPE_REJECT_REMOTE_CLIENTS bloqueia o caminho localhost', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao({ timeout: 2_000 });
    const resultadoRemoto = await executarCliente(caminhoLocalhost(prontidao.caminhoPipe));
    assert.equal(resultadoRemoto.respostaPong, false);
    assert.equal(resultadoRemoto.estado, 'rejeitado');

    const resultadoLocal = await executarCliente(prontidao.caminhoPipe);
    assert.equal(resultadoLocal.respostaPong, true);
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 0);
  });

  test('M09: FILE_FLAG_FIRST_PIPE_INSTANCE falha fechado diante de squatting', async (t) => {
    const sufixo = randomBytes(16).toString('hex');
    const caminho = `\\\\.\\pipe\\LOCAL\\argonauta-ipc-security-probe-${sufixo}`;
    const adversario = spawn(process.execPath, [squatter, caminho], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(() => {
      if (adversario.exitCode === null) {
        adversario.kill();
      }
    });
    await aguardarLinhaJson(adversario, (evento) => evento.evento === 'PRONTO');

    const helper = iniciarHelper({ sufixo });
    const saida = await helper.saida;
    assert.equal(saida.codigo, 2);
    assert.match(saida.stdout, /"criacao_ou_inspecao_segura_reprovada"/u);
    assert.doesNotMatch(saida.stdout, /PRONTO_DIAGNOSTICO/u);
  });

  test('M10: uma segunda instância não assume o atendimento', async () => {
    const sufixo = randomBytes(16).toString('hex');
    const primeiro = await iniciarEObterProntidao({ sufixo, timeout: 2_000 });
    const concorrentes = Array.from({ length: 4 }, () => iniciarHelper({ sufixo }));
    const saidasConcorrentes = await Promise.all(concorrentes.map((execucao) => execucao.saida));
    for (const saidaSegundo of saidasConcorrentes) {
      assert.equal(saidaSegundo.codigo, 2);
      assert.doesNotMatch(saidaSegundo.stdout, /PRONTO_DIAGNOSTICO/u);
    }

    const resultadoCliente = await executarCliente(primeiro.prontidao.caminhoPipe);
    assert.equal(resultadoCliente.respostaPong, true);
    const saidaPrimeiro = await primeiro.saidaHelper;
    assert.equal(saidaPrimeiro.codigo, 0);
  });

  for (const modo of [
    'invalido',
    'sufixo',
    'nulo',
    'excesso',
    'limite64',
    'vazio',
    'bytes',
    'lote',
    'truncado',
  ]) {
    test(`M11–M12: rejeita entrada ${modo} sem PONG_GATE`, async () => {
      const { prontidao, saidaHelper } = await iniciarEObterProntidao();
      const resultadoCliente = await executarCliente(prontidao.caminhoPipe, modo);
      assert.equal(resultadoCliente.respostaPong, false);
      const saida = await saidaHelper;
      assert.equal(saida.codigo, 3);
      assert.doesNotMatch(saida.stdout, /"respostaEnviada":true/u);
    });
  }

  test('M13: cliente silencioso termina por timeout finito', async () => {
    const inicio = Date.now();
    const { prontidao, saidaHelper } = await iniciarEObterProntidao({ timeout: 500 });
    const resultadoCliente = await executarCliente(prontidao.caminhoPipe, 'silencioso');
    assert.equal(resultadoCliente.respostaPong, false);
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 2);
    assert.ok(Date.now() - inicio < 4_000);
    assert.match(saida.stdout, /"atendimento":"tempo_esgotado"/u);
  });

  test('M13: servidor sem cliente cancela ConnectNamedPipe no limite', async () => {
    const inicio = Date.now();
    const { saidaHelper } = await iniciarEObterProntidao({ timeout: 300 });
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 2);
    assert.ok(Date.now() - inicio < 3_000);
    assert.match(saida.stdout, /"atendimento":"tempo_esgotado"/u);
  });

  test('M13: cancela repetidamente conexão sobreposta sem cliente', async () => {
    for (let indice = 0; indice < 5; indice += 1) {
      const { saidaHelper } = await iniciarEObterProntidao({ timeout: 300 });
      const saida = await saidaHelper;
      assert.equal(saida.codigo, 2);
      assert.match(saida.stdout, /"atendimento":"tempo_esgotado"/u);
    }
  });

  test('M13: cancela repetidamente leitura sobreposta de cliente silencioso', async () => {
    for (let indice = 0; indice < 4; indice += 1) {
      const { prontidao, saidaHelper } = await iniciarEObterProntidao({ timeout: 500 });
      const resultadoCliente = await executarCliente(prontidao.caminhoPipe, 'silencioso');
      assert.equal(resultadoCliente.respostaPong, false);
      const saida = await saidaHelper;
      assert.equal(saida.codigo, 2);
      assert.match(saida.stdout, /"atendimento":"tempo_esgotado"/u);
    }
  });

  test('M14: desconexão abrupta é controlada e não produz PONG_GATE', async () => {
    const { prontidao, saidaHelper } = await iniciarEObterProntidao();
    const resultadoCliente = await executarCliente(prontidao.caminhoPipe, 'abrupto');
    assert.equal(resultadoCliente.respostaPong, false);
    const saida = await saidaHelper;
    assert.equal(saida.codigo, 3);
    assert.doesNotMatch(saida.stdout, /"respostaEnviada":true/u);
  });

  test('M14: encerramento abrupto do helper libera o cliente e o pipe exato', async () => {
    const { helper, prontidao, saidaHelper } = await iniciarEObterProntidao({ timeout: 5_000 });
    const processoCliente = spawn(process.execPath, [cliente, prontidao.caminhoPipe, 'silencioso'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const saidaCliente = aguardarSaida(processoCliente);
    await new Promise((resolve) => setTimeout(resolve, 100));
    helper.kill();

    const [resultadoHelper, resultadoCliente] = await Promise.all([saidaHelper, saidaCliente]);
    assert.notEqual(resultadoHelper.codigo, 0);
    const clienteEncerrado = JSON.parse(resultadoCliente.stdout);
    assert.equal(clienteEncerrado.respostaPong, false);

    const tentativaResidual = await executarCliente(prontidao.caminhoPipe);
    assert.equal(tentativaResidual.estado, 'rejeitado');
    assert.equal(tentativaResidual.respostaPong, false);
  });

  test('M19: repete encerramento sem reabrir os pipes concluídos', async () => {
    for (let indice = 0; indice < 10; indice += 1) {
      const { prontidao, saidaHelper } = await iniciarEObterProntidao();
      const resultado = await executarCliente(prontidao.caminhoPipe);
      assert.equal(resultado.respostaPong, true);
      const saida = await saidaHelper;
      assert.equal(saida.codigo, 0);

      const tentativaResidual = await executarCliente(prontidao.caminhoPipe);
      assert.equal(tentativaResidual.respostaPong, false);
      assert.equal(tentativaResidual.estado, 'rejeitado');
    }
  });

  test('revisão estrutural: não há mutação tardia da DACL', async () => {
    const [seguranca, servidor] = await Promise.all([
      readFile(join(pastaProjeto, 'src', 'seguranca-logon.cpp'), 'utf8'),
      readFile(join(pastaProjeto, 'src', 'servidor-pipe-nomeado.cpp'), 'utf8'),
    ]);
    assert.doesNotMatch(`${seguranca}\n${servidor}`, /Set(?:Named)?SecurityInfo/u);
    assert.match(servidor, /FILE_FLAG_FIRST_PIPE_INSTANCE/u);
    assert.match(servidor, /PIPE_REJECT_REMOTE_CLIENTS/u);
    assert.match(servidor, /FILE_FLAG_OVERLAPPED/u);
    assert.match(seguranca, /SE_GROUP_LOGON_ID/u);
    assert.match(seguranca, /RevertToSelf/u);
  });
}
