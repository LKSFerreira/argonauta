import * as vscode from 'vscode';

import {
  limparArmazenamentoTemporario,
  verificarArmazenamentoSeguro,
  type EventoDiagnostico,
  type RegistrarDiagnostico,
} from './armazenamento-seguro';
import {
  classificarFalha,
  executarComLimiteTempo,
  type ErroTempoLimite,
} from './controle-assincrono';
import {
  criarRelatorio,
  formatarRelatorio,
  validarAusenciaDeDadosSensiveis,
  type AmbienteCompatibilidade,
  type ResultadoCompatibilidade,
} from './relatorio';

const IDENTIFICADOR_COMANDO = 'argonauta.verificarCompatibilidade';
const NOME_CANAL_SAIDA = 'Argonauta — Diagnóstico de Compatibilidade';
const COMPATIBILIDADE_API_PADRAO = '^1.85.0';
const LIMITE_OPERACAO_MS = 5_000;
const LIMITE_MENSAGEM_MS = 15_000;
const LIMITE_PROGRESSO_MS = 30_000;

let controladorExecucao: AbortController | undefined;
let armazenamentoAtivo: vscode.SecretStorage | undefined;
let canalSaidaAtivo: vscode.OutputChannel | undefined;

function obterCompatibilidadeApiDeclarada(contexto: vscode.ExtensionContext): string {
  const manifesto: unknown = contexto.extension.packageJSON;

  if (typeof manifesto !== 'object' || manifesto === null || !('engines' in manifesto)) {
    return COMPATIBILIDADE_API_PADRAO;
  }

  const mecanismos: unknown = manifesto.engines;
  if (typeof mecanismos !== 'object' || mecanismos === null || !('vscode' in mecanismos)) {
    return COMPATIBILIDADE_API_PADRAO;
  }

  return typeof mecanismos.vscode === 'string'
    ? mecanismos.vscode
    : COMPATIBILIDADE_API_PADRAO;
}

function declarouExecucaoNaInterface(contexto: vscode.ExtensionContext): boolean {
  const manifesto: unknown = contexto.extension.packageJSON;

  if (typeof manifesto !== 'object' || manifesto === null || !('extensionKind' in manifesto)) {
    return false;
  }

  return (
    Array.isArray(manifesto.extensionKind) &&
    manifesto.extensionKind.length === 1 &&
    manifesto.extensionKind[0] === 'ui'
  );
}

function criarAmbiente(contexto: vscode.ExtensionContext): AmbienteCompatibilidade {
  return {
    nomeIde: vscode.env.appName,
    versaoIdeApi: vscode.version,
    compatibilidadeApiDeclarada: obterCompatibilidadeApiDeclarada(contexto),
    versaoRuntimeNode: process.version,
    tipoInterface: vscode.env.uiKind === vscode.UIKind.Desktop ? 'desktop' : 'web',
    execucaoRemota: vscode.env.remoteName !== undefined,
  };
}

function criarRegistrador(canalSaida: vscode.OutputChannel): RegistrarDiagnostico {
  return (identificadorEtapa, evento, detalhe): void => {
    canalSaida.appendLine(
      `${new Date().toISOString()} [${identificadorEtapa}] [${evento}] ${detalhe}`,
    );
  };
}

function evidenciaFalha(erro: unknown, limiteMilissegundos: number): string {
  const classificacao = classificarFalha(erro);

  if (classificacao === 'timeout') {
    const limite = (erro as ErroTempoLimite).limiteMilissegundos;
    return `A operação excedeu o limite de ${limite || limiteMilissegundos} ms.`;
  }

  if (classificacao === 'cancelado') {
    return 'A operação foi cancelada antes da conclusão.';
  }

  return 'A API está disponível, mas a operação falhou.';
}

async function executarEtapa<Resultado>(
  identificadorEtapa: string,
  limiteMilissegundos: number,
  operacao: () => PromiseLike<Resultado> | Resultado,
  registrar: RegistrarDiagnostico,
  sinalCancelamento?: AbortSignal,
): Promise<Resultado> {
  registrar(identificadorEtapa, 'INICIO', 'Operação iniciada.');

  try {
    const resultado = await executarComLimiteTempo(
      identificadorEtapa,
      limiteMilissegundos,
      operacao,
      sinalCancelamento,
    );
    registrar(identificadorEtapa, 'PASS', 'Operação concluída.');
    return resultado;
  } catch (erro) {
    const classificacao = classificarFalha(erro);
    const evento: EventoDiagnostico =
      classificacao === 'timeout'
        ? 'TIMEOUT'
        : classificacao === 'cancelado'
          ? 'CANCELADO'
          : 'FAIL';
    registrar(identificadorEtapa, evento, evidenciaFalha(erro, limiteMilissegundos));
    throw erro;
  }
}

async function verificarOperacao(
  identificadorEtapa: string,
  verificacao: string,
  disponivel: boolean,
  evidenciaSucesso: string,
  operacao: () => PromiseLike<unknown> | unknown,
  registrar: RegistrarDiagnostico,
  sinalCancelamento: AbortSignal,
  limiteMilissegundos = LIMITE_OPERACAO_MS,
): Promise<ResultadoCompatibilidade> {
  if (!disponivel) {
    registrar(identificadorEtapa, 'UNSUPPORTED', 'API pública indisponível.');
    return {
      verificacao,
      estado: 'unsupported',
      evidencia: 'A API pública necessária não está disponível neste host.',
    };
  }

  try {
    await executarEtapa(
      identificadorEtapa,
      limiteMilissegundos,
      operacao,
      registrar,
      sinalCancelamento,
    );
    return { verificacao, estado: 'pass', evidencia: evidenciaSucesso };
  } catch (erro) {
    return {
      verificacao,
      estado: 'fail',
      evidencia: evidenciaFalha(erro, limiteMilissegundos),
    };
  }
}

async function executarVerificacoesInternas(
  contexto: vscode.ExtensionContext,
  registrar: RegistrarDiagnostico,
  sinalCancelamento: AbortSignal,
): Promise<ResultadoCompatibilidade[]> {
  const resultados: ResultadoCompatibilidade[] = [];
  let criarValorTemporario: (() => string) | undefined;

  resultados.push(
    await verificarOperacao(
      'API-10-REGISTRAR-COMANDO',
      'vscode.commands.registerCommand',
      typeof vscode.commands.registerCommand === 'function',
      'O comando foi registrado e está em execução.',
      () => undefined,
      registrar,
      sinalCancelamento,
    ),
  );

  resultados.push(
    await verificarOperacao(
      'API-20-NODE-NET',
      'Importação de node:net',
      typeof process?.versions?.node === 'string',
      'O módulo node:net foi importado e expõe createConnection.',
      async () => {
        const moduloNet = await import('node:net');
        if (typeof moduloNet.createConnection !== 'function') {
          throw new Error('createConnection indisponível.');
        }
      },
      registrar,
      sinalCancelamento,
    ),
  );

  resultados.push(
    await verificarOperacao(
      'API-30-NODE-CRYPTO',
      'Importação de node:crypto',
      typeof process?.versions?.node === 'string',
      'O módulo node:crypto foi importado e expõe createHash.',
      async () => {
        const moduloCrypto = await import('node:crypto');
        if (typeof moduloCrypto.createHash !== 'function') {
          throw new Error('createHash indisponível.');
        }
        criarValorTemporario = moduloCrypto.randomUUID;
      },
      registrar,
      sinalCancelamento,
    ),
  );

  if (criarValorTemporario === undefined) {
    registrar(
      'API-40-SECRETS',
      'FAIL',
      'A dependência node:crypto não foi validada; operações de segredo não foram iniciadas.',
    );
    resultados.push({
      verificacao: 'ExtensionContext.secrets',
      estado: 'fail',
      evidencia: 'A verificação não iniciou porque node:crypto não foi validado.',
    });
  } else {
    resultados.push(
      await verificarArmazenamentoSeguro(contexto.secrets, {
        limiteMilissegundos: LIMITE_OPERACAO_MS,
        sinalCancelamento,
        criarValorTemporario,
        registrar,
      }),
    );
  }

  const armazenamentoGlobalDisponivel =
    contexto.globalStorageUri !== undefined &&
    typeof contexto.globalStorageUri.scheme === 'string' &&
    contexto.globalStorageUri.scheme.length > 0;
  resultados.push(
    await verificarOperacao(
      'API-50-GLOBAL-STORAGE',
      'ExtensionContext.globalStorageUri',
      armazenamentoGlobalDisponivel,
      'A URI de armazenamento global está disponível; seu caminho não foi coletado.',
      () => undefined,
      registrar,
      sinalCancelamento,
    ),
  );

  resultados.push(
    await verificarOperacao(
      'API-60-RUNTIME-NODE',
      'Runtime Node.js local',
      typeof process?.versions?.node === 'string',
      `Node.js ${process.version} está disponível no Extension Host.`,
      () => undefined,
      registrar,
      sinalCancelamento,
    ),
  );

  const hostLocal =
    declarouExecucaoNaInterface(contexto) &&
    vscode.env.uiKind === vscode.UIKind.Desktop &&
    vscode.env.remoteName === undefined &&
    typeof process?.versions?.node === 'string';
  resultados.push(
    await verificarOperacao(
      'API-70-EXTENSION-KIND',
      'extensionKind ui no host local',
      hostLocal,
      'A extensão declarou extensionKind ui e executa em host Node.js desktop não remoto.',
      () => undefined,
      registrar,
      sinalCancelamento,
    ),
  );

  return resultados;
}

async function verificarComProgresso(
  contexto: vscode.ExtensionContext,
  registrar: RegistrarDiagnostico,
  controlador: AbortController,
): Promise<{ resultadoProgresso: ResultadoCompatibilidade; resultados: ResultadoCompatibilidade[] }> {
  const disponivel = typeof vscode.window.withProgress === 'function';
  if (!disponivel) {
    registrar('API-80-WITH-PROGRESS', 'UNSUPPORTED', 'API pública indisponível.');
    return {
      resultadoProgresso: {
        verificacao: 'vscode.window.withProgress',
        estado: 'unsupported',
        evidencia: 'A API pública necessária não está disponível neste host.',
      },
      resultados: await executarVerificacoesInternas(
        contexto,
        registrar,
        controlador.signal,
      ),
    };
  }

  let resultados: ResultadoCompatibilidade[] = [];
  let cancelamentoSolicitado = false;

  try {
    resultados = await executarEtapa(
      'API-80-WITH-PROGRESS',
      LIMITE_PROGRESSO_MS,
      () =>
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Argonauta: verificando compatibilidade',
            cancellable: true,
          },
          async (progresso, tokenCancelamento) => {
            const inscricaoCancelamento = tokenCancelamento.onCancellationRequested(() => {
              cancelamentoSolicitado = true;
              registrar('CTRL-20-CANCELAMENTO', 'CANCELADO', 'Cancelamento solicitado pelo usuário.');
              controlador.abort();
            });

            registrar('CTRL-10-CALLBACK-PROGRESSO', 'INICIO', 'Callback iniciado.');
            progresso.report({ message: 'Validando APIs públicas…' });

            try {
              return await executarVerificacoesInternas(
                contexto,
                registrar,
                controlador.signal,
              );
            } finally {
              inscricaoCancelamento.dispose();
              registrar('CTRL-10-CALLBACK-PROGRESSO', 'FIM', 'Callback encerrado.');
            }
          },
        ),
      registrar,
      controlador.signal,
    );

    return {
      resultadoProgresso: {
        verificacao: 'vscode.window.withProgress',
        estado: cancelamentoSolicitado ? 'fail' : 'pass',
        evidencia: cancelamentoSolicitado
          ? 'A operação com progresso foi cancelada pelo usuário.'
          : 'A operação com progresso foi concluída.',
      },
      resultados,
    };
  } catch (erro) {
    controlador.abort();
    return {
      resultadoProgresso: {
        verificacao: 'vscode.window.withProgress',
        estado: 'fail',
        evidencia: evidenciaFalha(erro, LIMITE_PROGRESSO_MS),
      },
      resultados,
    };
  }
}

async function verificarMensagemInformativa(
  registrar: RegistrarDiagnostico,
  sinalCancelamento: AbortSignal,
): Promise<ResultadoCompatibilidade> {
  return verificarOperacao(
    'API-90-MENSAGEM-INFORMATIVA',
    'vscode.window.showInformationMessage',
    typeof vscode.window.showInformationMessage === 'function',
    'A mensagem foi exibida e concluída pelo usuário.',
    () =>
      vscode.window.showInformationMessage(
        'Argonauta: confirme o funcionamento da mensagem informativa.',
        'Confirmar',
      ),
    registrar,
    sinalCancelamento,
    LIMITE_MENSAGEM_MS,
  );
}

async function verificarCompatibilidade(
  contexto: vscode.ExtensionContext,
  canalSaida: vscode.OutputChannel,
  controlador: AbortController,
): Promise<void> {
  const registrar = criarRegistrador(canalSaida);
  canalSaida.clear();
  canalSaida.show(true);
  registrar('CTRL-00-COMANDO', 'INICIO', 'Execução iniciada.');

  const { resultadoProgresso, resultados } = await verificarComProgresso(
    contexto,
    registrar,
    controlador,
  );

  resultados.unshift(resultadoProgresso);
  resultados.push(
    await verificarMensagemInformativa(registrar, controlador.signal),
  );

  const relatorio = criarRelatorio(criarAmbiente(contexto), resultados);
  const relatorioFormatado = formatarRelatorio(relatorio);
  validarAusenciaDeDadosSensiveis(relatorioFormatado);

  canalSaida.appendLine('');
  canalSaida.appendLine(relatorioFormatado);
  registrar('CTRL-00-COMANDO', 'PASS', 'Relatório final emitido.');
}

/** Ativa exclusivamente o comando de diagnóstico local da POC-05B Etapa 0. */
export function activate(contexto: vscode.ExtensionContext): void {
  const canalSaida = vscode.window.createOutputChannel(NOME_CANAL_SAIDA);
  armazenamentoAtivo = contexto.secrets;

  const comando = vscode.commands.registerCommand(IDENTIFICADOR_COMANDO, async () => {
    if (controladorExecucao !== undefined) {
      canalSaida.show(true);
      criarRegistrador(canalSaida)(
        'CTRL-30-CONCORRENCIA',
        'FAIL',
        'Uma execução já está em andamento; a nova solicitação foi rejeitada.',
      );
      return;
    }

    controladorExecucao = new AbortController();

    try {
      await verificarCompatibilidade(contexto, canalSaida, controladorExecucao);
    } catch {
      criarRegistrador(canalSaida)(
        'CTRL-00-COMANDO',
        'FAIL',
        'A execução terminou com uma falha não esperada.',
      );
      canalSaida.show(true);
    } finally {
      const limpezaConfirmada = await limparArmazenamentoTemporario(
        armazenamentoAtivo,
        LIMITE_OPERACAO_MS,
      );
      criarRegistrador(canalSaida)(
        'SEC-80-LIMPEZA-ENCERRAMENTO',
        limpezaConfirmada ? 'LIMPEZA' : 'FAIL',
        limpezaConfirmada
          ? 'Ausência do valor temporário confirmada.'
          : 'A limpeza não pôde ser confirmada; a chave fixa será verificada na próxima execução.',
      );
      controladorExecucao = undefined;
    }
  });

  contexto.subscriptions.push(comando, canalSaida);
  canalSaidaAtivo = canalSaida;
}

export async function deactivate(): Promise<void> {
  controladorExecucao?.abort();
  const limpezaConfirmada = await limparArmazenamentoTemporario(
    armazenamentoAtivo,
    LIMITE_OPERACAO_MS,
  );
  if (!limpezaConfirmada) {
    canalSaidaAtivo?.appendLine(
      `${new Date().toISOString()} [SEC-90-DESATIVACAO] [FAIL] A limpeza do valor temporário não pôde ser confirmada.`,
    );
  }
  controladorExecucao = undefined;
  armazenamentoAtivo = undefined;
  canalSaidaAtivo = undefined;
}
