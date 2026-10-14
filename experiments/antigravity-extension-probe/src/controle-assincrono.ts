export class ErroTempoLimite extends Error {
  public constructor(
    public readonly identificadorEtapa: string,
    public readonly limiteMilissegundos: number,
  ) {
    super(`A etapa ${identificadorEtapa} excedeu o limite de tempo.`);
    this.name = 'ErroTempoLimite';
  }
}

export class ErroCancelamento extends Error {
  public constructor(public readonly identificadorEtapa: string) {
    super(`A etapa ${identificadorEtapa} foi cancelada.`);
    this.name = 'ErroCancelamento';
  }
}

/** Limita a espera sem afirmar que a operação subjacente foi cancelada. */
export function executarComLimiteTempo<Resultado>(
  identificadorEtapa: string,
  limiteMilissegundos: number,
  operacao: () => PromiseLike<Resultado> | Resultado,
  sinalCancelamento?: AbortSignal,
): Promise<Resultado> {
  if (limiteMilissegundos <= 0) {
    throw new Error('O limite de tempo deve ser maior que zero.');
  }

  return new Promise<Resultado>((resolver, rejeitar) => {
    let concluida = false;

    const concluir = (acao: () => void): void => {
      if (concluida) {
        return;
      }

      concluida = true;
      clearTimeout(temporizador);
      sinalCancelamento?.removeEventListener('abort', cancelar);
      acao();
    };

    const cancelar = (): void => {
      concluir(() => rejeitar(new ErroCancelamento(identificadorEtapa)));
    };

    const temporizador = setTimeout(() => {
      concluir(() =>
        rejeitar(new ErroTempoLimite(identificadorEtapa, limiteMilissegundos)),
      );
    }, limiteMilissegundos);

    if (sinalCancelamento?.aborted) {
      cancelar();
      return;
    }

    sinalCancelamento?.addEventListener('abort', cancelar, { once: true });

    Promise.resolve()
      .then(operacao)
      .then(
        (resultado) => concluir(() => resolver(resultado)),
        (erro: unknown) => concluir(() => rejeitar(erro)),
      );
  });
}

export function classificarFalha(erro: unknown): 'timeout' | 'cancelado' | 'erro' {
  if (erro instanceof ErroTempoLimite) {
    return 'timeout';
  }

  if (erro instanceof ErroCancelamento) {
    return 'cancelado';
  }

  return 'erro';
}
