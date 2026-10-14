import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const executarArquivo = promisify(execFile);
const CAMINHO_SCRIPT = fileURLToPath(import.meta.url);
const TEMPO_LIMITE_MILISSEGUNDOS = 3_000;

function criarResultadoConexao(estado, detalhes = {}) {
  return { estado, ...detalhes };
}

function trocarMensagemNoProcessoAtual(caminhoPipe) {
  return new Promise((resolve) => {
    const socket = net.createConnection(caminhoPipe);
    const fragmentos = [];
    let concluido = false;

    function concluir(resultado) {
      if (concluido) {
        return;
      }

      concluido = true;
      socket.destroy();
      resolve(resultado);
    }

    socket.setTimeout(TEMPO_LIMITE_MILISSEGUNDOS);
    socket.once('connect', () => socket.end('PING_GATE'));
    socket.on('data', (fragmento) => fragmentos.push(fragmento));
    socket.once('end', () => {
      const resposta = Buffer.concat(fragmentos).toString('utf8');
      concluir(criarResultadoConexao('conectado', { respostaCorreta: resposta === 'PONG_GATE' }));
    });
    socket.once('timeout', () => concluir(criarResultadoConexao('timeout')));
    socket.once('error', (erro) => {
      concluir(criarResultadoConexao('rejeitado', { codigo: erro.code ?? 'DESCONHECIDO' }));
    });
  });
}

async function trocarMensagemEmProcessoIndependente(caminhoPipe) {
  try {
    const { stdout } = await executarArquivo(
      process.execPath,
      [CAMINHO_SCRIPT, '--cliente', caminhoPipe],
      {
        timeout: TEMPO_LIMITE_MILISSEGUNDOS * 2,
        windowsHide: true,
      },
    );

    return JSON.parse(stdout);
  } catch (erro) {
    return criarResultadoConexao('erro_processo_cliente', {
      codigo: erro.code ?? 'DESCONHECIDO',
    });
  }
}

async function inspecionarDacl(nomePipe) {
  const comando = [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName 'System.IO.Pipes.AccessControl'",
    `$cliente=[System.IO.Pipes.NamedPipeClientStream]::new('.', '${nomePipe}', [System.IO.Pipes.PipeDirection]::InOut, [System.IO.Pipes.PipeOptions]::None)`,
    `$cliente.Connect(${TEMPO_LIMITE_MILISSEGUNDOS})`,
    '$seguranca=[System.IO.Pipes.PipesAclExtensions]::GetAccessControl($cliente)',
    '$sddl=$seguranca.GetSecurityDescriptorSddlForm([System.Security.AccessControl.AccessControlSections]::All)',
    '$cliente.Dispose()',
    '$sddl',
  ].join('; ');

  try {
    const { stdout } = await executarArquivo('pwsh.exe', ['-NoProfile', '-Command', comando], {
      timeout: TEMPO_LIMITE_MILISSEGUNDOS * 2,
      windowsHide: true,
    });
    const sddl = stdout.trim();
    const sddlSanitizada = sddl
      .replace(/S-1-5-5-\d+-\d+/g, '<SID_LOGON>')
      .replace(/S-\d-(?:\d+-)+\d+/g, '<SID_IDENTIDADE>');
    const leituraEveryone = sddl.includes('(A;;FR;;;WD)');
    const leituraAnonimo = sddl.includes('(A;;FR;;;AN)');
    const sidLogonPresente = /S-1-5-5-\d+-\d+/.test(sddl);

    return {
      estado: 'inspecionada',
      sddlSanitizada,
      leituraEveryone,
      leituraAnonimo,
      sidLogonPresente,
      restritaAoLogon: !leituraEveryone && !leituraAnonimo && sidLogonPresente,
    };
  } catch (erro) {
    return {
      estado: 'nao_inspecionada',
      codigo: erro.code ?? 'DESCONHECIDO',
      mensagem: 'Não foi possível inspecionar a DACL com as APIs públicas disponíveis.',
    };
  }
}

function verificarSegundaInstancia(caminhoPipe) {
  return new Promise((resolve) => {
    const segundoServidor = net.createServer();

    segundoServidor.once('error', (erro) => {
      resolve({ estado: 'rejeitada', codigo: erro.code ?? 'DESCONHECIDO' });
    });
    segundoServidor.listen({ path: caminhoPipe, exclusive: true }, () => {
      segundoServidor.close(() => resolve({ estado: 'aceita' }));
    });
  });
}

function iniciarServidor(caminhoPipe, conexoes) {
  const servidor = net.createServer((socket) => {
    conexoes.add(socket);
    socket.once('close', () => conexoes.delete(socket));
    socket.once('error', () => conexoes.delete(socket));
    socket.once('data', (fragmento) => {
      if (fragmento.toString('utf8') === 'PING_GATE') {
        socket.end('PONG_GATE');
        return;
      }

      socket.destroy();
    });
  });

  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(
      {
        path: caminhoPipe,
        readableAll: false,
        writableAll: false,
        exclusive: true,
      },
      () => resolve(servidor),
    );
  });
}

function encerrarServidor(servidor, conexoes) {
  for (const conexao of conexoes) {
    conexao.destroy();
  }

  return new Promise((resolve) => servidor.close(resolve));
}

async function executarGate() {
  if (process.platform !== 'win32') {
    console.log(JSON.stringify({ estado: 'unsupported', motivo: 'O gate exige Windows.' }, null, 2));
    process.exitCode = 2;
    return;
  }

  const sufixo = randomBytes(12).toString('hex');
  const nomePipe = `LOCAL\\argonauta-ipc-gate-${sufixo}`;
  const caminhoLocal = `\\\\.\\pipe\\${nomePipe}`;
  const caminhoRemotoLocalhost = `\\\\localhost\\pipe\\${nomePipe}`;
  const conexoes = new Set();
  let servidor;

  try {
    servidor = await iniciarServidor(caminhoLocal, conexoes);
    const comunicacaoLocal = await trocarMensagemEmProcessoIndependente(caminhoLocal);
    const dacl = await inspecionarDacl(nomePipe);
    const acessoViaSmb = await trocarMensagemEmProcessoIndependente(caminhoRemotoLocalhost);
    const segundaInstancia = await verificarSegundaInstancia(caminhoLocal);
    const localDuplexAprovado =
      comunicacaoLocal.estado === 'conectado' && comunicacaoLocal.respostaCorreta === true;
    const acessoRemotoBloqueado = acessoViaSmb.estado === 'rejeitado';
    const daclAprovada = dacl.estado === 'inspecionada' && dacl.restritaAoLogon === true;
    const segundaInstanciaBloqueada =
      segundaInstancia.estado === 'rejeitada' && segundaInstancia.codigo === 'EADDRINUSE';
    const gateAprovado =
      localDuplexAprovado &&
      acessoRemotoBloqueado &&
      daclAprovada &&
      segundaInstanciaBloqueada;

    console.log(
      JSON.stringify(
        {
          estado: gateAprovado ? 'pass' : 'blocked',
          plataforma: process.platform,
          node: process.version,
          libuv: process.versions.uv,
          formatoPipe: '\\\\.\\pipe\\LOCAL\\argonauta-ipc-gate-<aleatorio>',
          comunicacaoLocal,
          dacl,
          acessoViaSmb,
          segundaInstancia,
        },
        null,
        2,
      ),
    );
    process.exitCode = gateAprovado ? 0 : 2;
  } finally {
    if (servidor?.listening) {
      await encerrarServidor(servidor, conexoes);
    }
  }
}

if (process.argv[2] === '--cliente') {
  const caminhoPipe = process.argv[3];

  if (!caminhoPipe) {
    console.log(JSON.stringify(criarResultadoConexao('configuracao_invalida')));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(await trocarMensagemNoProcessoAtual(caminhoPipe)));
  }
} else {
  await executarGate();
}
