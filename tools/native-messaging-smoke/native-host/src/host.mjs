import { processarMensagem, validarOrigemChamadora } from './messages.mjs';
import { DecodificadorMensagensNativas, serializarMensagem } from './protocol.mjs';

let falhou = false;

function registrarFalha(erro) {
  if (falhou) {
    return;
  }

  falhou = true;
  process.exitCode = 1;
  process.stderr.write(`Falha no Native Messaging Host: ${erro.message}\n`);
  process.stdin.destroy();
}

function responder(mensagem) {
  const resposta = processarMensagem(mensagem);
  process.stdout.write(serializarMensagem(resposta));
}

try {
  validarOrigemChamadora(process.argv.slice(2));
} catch (erro) {
  registrarFalha(erro);
}

const decodificador = new DecodificadorMensagensNativas(responder);

if (!falhou) {
  process.stdin.on('data', (parte) => {
    try {
      decodificador.receber(parte);
    } catch (erro) {
      registrarFalha(erro);
    }
  });

  process.stdin.on('end', () => {
    try {
      decodificador.finalizar();
    } catch (erro) {
      registrarFalha(erro);
    }
  });

  process.stdin.on('error', registrarFalha);
  process.stdout.on('error', registrarFalha);
  process.stdin.resume();
}
