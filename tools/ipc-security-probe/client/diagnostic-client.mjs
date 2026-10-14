import net from 'node:net';
import { pathToFileURL } from 'node:url';

const TEMPO_LIMITE_PADRAO = 2_500;

export function criarFrameDiagnostico(payload) {
  const corpo = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  if (corpo.length > 255) {
    throw new RangeError('O payload diagnóstico excede a capacidade do cabeçalho de teste.');
  }
  return Buffer.concat([Buffer.from([corpo.length]), corpo]);
}

function frameParaModo(modo) {
  switch (modo) {
    case 'valido':
    case 'fragmentado':
    case 'segundo-frame':
      return criarFrameDiagnostico('PING_GATE');
    case 'invalido':
      return criarFrameDiagnostico('PING_FAIL');
    case 'sufixo':
      return criarFrameDiagnostico('PING_GATEX');
    case 'nulo':
      return criarFrameDiagnostico(Buffer.from('PING_GATE\0', 'utf8'));
    case 'excesso':
      return Buffer.concat([Buffer.from([65]), Buffer.alloc(65, 0x41)]);
    case 'limite64':
      return criarFrameDiagnostico(Buffer.alloc(64, 0x41));
    case 'vazio':
      return Buffer.from([0]);
    case 'bytes':
      return criarFrameDiagnostico(Buffer.from([0xff, 0xfe, 0xfd]));
    case 'lote':
      return Buffer.concat([
        criarFrameDiagnostico('PING_GATE'),
        criarFrameDiagnostico('PING_GATE'),
      ]);
    case 'truncado':
    case 'abrupto':
      return Buffer.concat([Buffer.from([9]), Buffer.from('PING', 'utf8')]);
    case 'silencioso':
      return null;
    default:
      throw new Error('O modo do cliente diagnóstico não é reconhecido.');
  }
}

export function executarClienteDiagnostico({
  caminhoPipe,
  modo = 'valido',
  tempoLimiteMs = TEMPO_LIMITE_PADRAO,
}) {
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

    socket.setTimeout(tempoLimiteMs);
    socket.once('connect', () => {
      if (modo === 'silencioso') {
        return;
      }

      const frame = frameParaModo(modo);
      if (modo === 'fragmentado') {
        socket.write(frame.subarray(0, 1));
        setTimeout(() => socket.write(frame.subarray(1, 5)), 20);
        setTimeout(() => socket.write(frame.subarray(5)), 40);
        return;
      }
      if (modo === 'segundo-frame') {
        socket.write(frame);
        setTimeout(() => {
          if (!socket.destroyed) {
            socket.write(criarFrameDiagnostico('PING_GATE'));
          }
        }, 15);
        return;
      }
      if (modo === 'abrupto') {
        socket.write(frame, () => socket.destroy());
        return;
      }
      if (modo === 'truncado') {
        socket.end(frame);
        return;
      }
      socket.write(frame);
    });
    socket.on('data', (fragmento) => {
      fragmentos.push(fragmento);
      const resposta = Buffer.concat(fragmentos);
      if (resposta.equals(Buffer.from('PONG_GATE', 'utf8'))) {
        socket.write(Buffer.from([0x06]));
      }
    });
    socket.once('end', () => {
      const resposta = Buffer.concat(fragmentos);
      concluir({
        estado: 'encerrado',
        respostaPong: resposta.equals(Buffer.from('PONG_GATE', 'utf8')),
        bytesResposta: resposta.length,
      });
    });
    socket.once('close', () => {
      if (!concluido) {
        const resposta = Buffer.concat(fragmentos);
        concluir({
          estado: 'fechado',
          respostaPong: resposta.equals(Buffer.from('PONG_GATE', 'utf8')),
          bytesResposta: resposta.length,
        });
      }
    });
    socket.once('timeout', () => concluir({ estado: 'timeout', respostaPong: false, bytesResposta: 0 }));
    socket.once('error', (erro) => {
      const resposta = Buffer.concat(fragmentos);
      const respostaPong = resposta.equals(Buffer.from('PONG_GATE', 'utf8'));
      concluir({
        estado: respostaPong ? 'encerrado' : 'rejeitado',
        respostaPong,
        bytesResposta: resposta.length,
        ...(respostaPong ? {} : { codigo: erro.code ?? 'DESCONHECIDO' }),
      });
    });
  });
}

async function executarLinhaComando() {
  const [, , caminhoPipe, modo = 'valido'] = process.argv;
  if (!caminhoPipe) {
    process.stdout.write(JSON.stringify({ estado: 'configuracao_invalida' }));
    process.exitCode = 3;
    return;
  }

  const resultado = await executarClienteDiagnostico({ caminhoPipe, modo });
  process.stdout.write(JSON.stringify(resultado));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executarLinhaComando();
}
