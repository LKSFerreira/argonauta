export type EstadoCompatibilidade = 'pass' | 'fail' | 'unsupported';

export interface ResultadoCompatibilidade {
  readonly verificacao: string;
  readonly estado: EstadoCompatibilidade;
  readonly evidencia: string;
}

export interface AmbienteCompatibilidade {
  readonly nomeIde: string;
  readonly versaoIdeApi: string;
  readonly compatibilidadeApiDeclarada: string;
  readonly versaoRuntimeNode: string;
  readonly tipoInterface: string;
  readonly execucaoRemota: boolean;
}

export interface RelatorioCompatibilidade {
  readonly esquema: 'argonauta.compatibilidade/1';
  readonly ambiente: AmbienteCompatibilidade;
  readonly resultados: readonly ResultadoCompatibilidade[];
  readonly resumo: Readonly<Record<EstadoCompatibilidade, number>>;
}

const EXPRESSOES_DADOS_SENSIVEIS = [
  /[A-Za-z]:\\(?:Users|Usuários)\\[^\\\s]+/iu,
  /\\\\[^\\\s]+\\[^\s]+/u,
  /\/(?:home|Users)\/[^/\s]+/u,
];

/** Monta um relatório que contém apenas capacidades e versões permitidas. */
export function criarRelatorio(
  ambiente: AmbienteCompatibilidade,
  resultados: readonly ResultadoCompatibilidade[],
): RelatorioCompatibilidade {
  return {
    esquema: 'argonauta.compatibilidade/1',
    ambiente,
    resultados,
    resumo: {
      pass: resultados.filter(({ estado }) => estado === 'pass').length,
      fail: resultados.filter(({ estado }) => estado === 'fail').length,
      unsupported: resultados.filter(({ estado }) => estado === 'unsupported').length,
    },
  };
}

/** Impede que uma alteração futura inclua caminhos pessoais no relatório exibido. */
export function validarAusenciaDeDadosSensiveis(relatorioSerializado: string): void {
  const contemDadoSensivel = EXPRESSOES_DADOS_SENSIVEIS.some((expressao) =>
    expressao.test(relatorioSerializado),
  );

  if (contemDadoSensivel) {
    throw new Error('O relatório foi bloqueado porque contém um caminho pessoal ou de rede.');
  }
}

/** Produz texto legível e determinístico para o canal de saída da extensão. */
export function formatarRelatorio(relatorio: RelatorioCompatibilidade): string {
  const linhasResultados = relatorio.resultados.map(
    ({ verificacao, estado, evidencia }) => `- [${estado}] ${verificacao}: ${evidencia}`,
  );

  return [
    'Argonauta — Relatório de compatibilidade',
    '',
    `IDE: ${relatorio.ambiente.nomeIde}`,
    `Versão IDE/API exposta: ${relatorio.ambiente.versaoIdeApi}`,
    `Compatibilidade API declarada: ${relatorio.ambiente.compatibilidadeApiDeclarada}`,
    `Runtime Node.js: ${relatorio.ambiente.versaoRuntimeNode}`,
    `Interface: ${relatorio.ambiente.tipoInterface}`,
    `Execução remota: ${relatorio.ambiente.execucaoRemota ? 'sim' : 'não'}`,
    '',
    ...linhasResultados,
    '',
    `Resumo: pass=${relatorio.resumo.pass}, fail=${relatorio.resumo.fail}, unsupported=${relatorio.resumo.unsupported}`,
  ].join('\n');
}
