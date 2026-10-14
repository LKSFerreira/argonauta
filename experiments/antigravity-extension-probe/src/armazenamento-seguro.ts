import {
  classificarFalha,
  executarComLimiteTempo,
  type ErroTempoLimite,
} from './controle-assincrono';
import type { ResultadoCompatibilidade } from './relatorio';

export const CHAVE_TEMPORARIA = 'argonauta.poc05b.probe.temporario';

export interface ArmazenamentoSeguro {
  get(chave: string): PromiseLike<string | undefined>;
  store(chave: string, valor: string): PromiseLike<void>;
  delete(chave: string): PromiseLike<void>;
}

export type EventoDiagnostico =
  | 'INICIO'
  | 'FIM'
  | 'PASS'
  | 'FAIL'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'CANCELADO'
  | 'LIMPEZA';

export type RegistrarDiagnostico = (
  identificadorEtapa: string,
  evento: EventoDiagnostico,
  detalhe: string,
) => void;

export interface OpcoesArmazenamentoSeguro {
  readonly limiteMilissegundos: number;
  readonly sinalCancelamento?: AbortSignal;
  readonly criarValorTemporario: () => string;
  readonly registrar: RegistrarDiagnostico;
}

function evidenciaFalha(erro: unknown): string {
  const classificacao = classificarFalha(erro);

  if (classificacao === 'timeout') {
    const limite = (erro as ErroTempoLimite).limiteMilissegundos;
    return `Uma operação do armazenamento seguro excedeu ${limite} ms.`;
  }

  if (classificacao === 'cancelado') {
    return 'A verificação do armazenamento seguro foi cancelada.';
  }

  return 'Uma operação do armazenamento seguro falhou.';
}

async function executarOperacao<Resultado>(
  identificadorEtapa: string,
  operacao: () => PromiseLike<Resultado> | Resultado,
  opcoes: OpcoesArmazenamentoSeguro,
  usarCancelamento = true,
): Promise<Resultado> {
  opcoes.registrar(identificadorEtapa, 'INICIO', 'Operação iniciada.');

  try {
    const resultado = await executarComLimiteTempo(
      identificadorEtapa,
      opcoes.limiteMilissegundos,
      operacao,
      usarCancelamento ? opcoes.sinalCancelamento : undefined,
    );
    opcoes.registrar(identificadorEtapa, 'PASS', 'Operação concluída.');
    return resultado;
  } catch (erro) {
    const classificacao = classificarFalha(erro);
    const evento = classificacao === 'timeout' ? 'TIMEOUT' : classificacao === 'cancelado' ? 'CANCELADO' : 'FAIL';
    opcoes.registrar(identificadorEtapa, evento, evidenciaFalha(erro));
    throw erro;
  }
}

async function tentarLimpeza(
  armazenamento: ArmazenamentoSeguro,
  identificadorEtapa: string,
  opcoes: OpcoesArmazenamentoSeguro,
): Promise<boolean> {
  try {
    await executarOperacao(
      identificadorEtapa,
      () => armazenamento.delete(CHAVE_TEMPORARIA),
      opcoes,
      false,
    );
    opcoes.registrar(identificadorEtapa, 'LIMPEZA', 'Ausência do valor temporário confirmada.');
    return true;
  } catch {
    return false;
  }
}

function agendarLimpezaTardia(
  promessaArmazenamento: Promise<void>,
  armazenamento: ArmazenamentoSeguro,
  opcoes: OpcoesArmazenamentoSeguro,
): void {
  void promessaArmazenamento.then(
    async () => {
      await tentarLimpeza(armazenamento, 'SEC-50-LIMPEZA-TARDIA', opcoes);
    },
    async () => {
      await tentarLimpeza(armazenamento, 'SEC-50-LIMPEZA-TARDIA', opcoes);
    },
  );
}

export async function verificarArmazenamentoSeguro(
  armazenamento: ArmazenamentoSeguro | undefined,
  opcoes: OpcoesArmazenamentoSeguro,
): Promise<ResultadoCompatibilidade> {
  const identificador = 'API-40-SECRETS';
  const disponivel =
    armazenamento !== undefined &&
    typeof armazenamento.store === 'function' &&
    typeof armazenamento.get === 'function' &&
    typeof armazenamento.delete === 'function';

  if (!disponivel || armazenamento === undefined) {
    opcoes.registrar(identificador, 'UNSUPPORTED', 'API pública indisponível.');
    return {
      verificacao: 'ExtensionContext.secrets',
      estado: 'unsupported',
      evidencia: 'A API pública necessária não está disponível neste host.',
    };
  }

  opcoes.registrar(identificador, 'INICIO', 'Verificação iniciada.');
  let falhaOperacao: unknown;
  let promessaArmazenamento: Promise<void> | undefined;
  let armazenamentoConcluido = false;

  try {
    const limpezaInicialConfirmada = await tentarLimpeza(
      armazenamento,
      'SEC-10-LIMPEZA-INICIAL',
      opcoes,
    );
    if (!limpezaInicialConfirmada) {
      throw new Error('A limpeza inicial não foi confirmada.');
    }

    const valorTemporario = opcoes.criarValorTemporario();
    opcoes.registrar('SEC-20-STORE', 'INICIO', 'Operação iniciada.');
    await executarComLimiteTempo(
      'SEC-20-STORE',
      opcoes.limiteMilissegundos,
      () => {
        promessaArmazenamento = Promise.resolve(
          armazenamento.store(CHAVE_TEMPORARIA, valorTemporario),
        );
        return promessaArmazenamento;
      },
      opcoes.sinalCancelamento,
    );
    armazenamentoConcluido = true;
    opcoes.registrar('SEC-20-STORE', 'PASS', 'Operação concluída.');

    const valorLido = await executarOperacao(
      'SEC-30-GET',
      () => armazenamento.get(CHAVE_TEMPORARIA),
      opcoes,
    );
    if (valorLido !== valorTemporario) {
      throw new Error('O valor temporário recuperado é divergente.');
    }
  } catch (erro) {
    falhaOperacao = erro;
    if (promessaArmazenamento !== undefined && !armazenamentoConcluido) {
      const classificacao = classificarFalha(erro);
      opcoes.registrar(
        'SEC-20-STORE',
        classificacao === 'timeout' ? 'TIMEOUT' : classificacao === 'cancelado' ? 'CANCELADO' : 'FAIL',
        evidenciaFalha(erro),
      );
      agendarLimpezaTardia(promessaArmazenamento, armazenamento, opcoes);
    }
  }

  const limpezaFinalConfirmada = await tentarLimpeza(
    armazenamento,
    'SEC-40-LIMPEZA-FINAL',
    opcoes,
  );

  if (falhaOperacao !== undefined || !limpezaFinalConfirmada) {
    opcoes.registrar(identificador, 'FAIL', evidenciaFalha(falhaOperacao));
    return {
      verificacao: 'ExtensionContext.secrets',
      estado: 'fail',
      evidencia: falhaOperacao
        ? evidenciaFalha(falhaOperacao)
        : 'A remoção do valor temporário não pôde ser confirmada.',
    };
  }

  opcoes.registrar(identificador, 'PASS', 'Verificação e limpeza concluídas.');
  return {
    verificacao: 'ExtensionContext.secrets',
    estado: 'pass',
    evidencia: 'Gravação, leitura e remoção do valor temporário foram confirmadas.',
  };
}

export async function limparArmazenamentoTemporario(
  armazenamento: ArmazenamentoSeguro | undefined,
  limiteMilissegundos: number,
): Promise<boolean> {
  if (armazenamento === undefined) {
    return true;
  }

  try {
    await executarComLimiteTempo(
      'SEC-90-DESATIVACAO',
      limiteMilissegundos,
      () => armazenamento.delete(CHAVE_TEMPORARIA),
    );
    return true;
  } catch {
    return false;
  }
}
