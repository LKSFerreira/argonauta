import { ErroProtocolo, falhar } from './erros.js';
import { validarEstruturaJsonPassiva } from './estrutura-json.js';
import { LIMITE_PAYLOAD_CONTRATO } from './tipos.js';

export type OrdemBytes = 'LE' | 'BE';
export const LIMITE_FRAGMENTO_PADRAO = LIMITE_PAYLOAD_CONTRATO + 4;
export const LIMITE_MENSAGENS_POR_ADICAO = 32;

function escreverComprimento(cabecalho: Buffer, comprimento: number, ordem: OrdemBytes): void {
  if (ordem === 'LE') {
    cabecalho.writeUInt32LE(comprimento, 0);
    return;
  }

  cabecalho.writeUInt32BE(comprimento, 0);
}

function lerComprimento(cabecalho: Buffer, ordem: OrdemBytes): number {
  return ordem === 'LE' ? cabecalho.readUInt32LE(0) : cabecalho.readUInt32BE(0);
}

function normalizarLimitePayload(limiteSolicitado: number): number {
  if (!Number.isSafeInteger(limiteSolicitado) || limiteSolicitado < 1) {
    falhar('VALOR_INVALIDO');
  }

  return Math.min(limiteSolicitado, LIMITE_PAYLOAD_CONTRATO);
}

export function serializarEnquadramento(
  valor: unknown,
  ordem: OrdemBytes,
  limitePayload = LIMITE_PAYLOAD_CONTRATO
): Buffer {
  const limiteEfetivo = normalizarLimitePayload(limitePayload);
  validarEstruturaJsonPassiva(valor);
  let json: string | undefined;

  try {
    json = JSON.stringify(valor);
  } catch {
    falhar('JSON_INVALIDO');
  }

  if (json === undefined) {
    falhar('JSON_INVALIDO');
  }

  const payload = Buffer.from(json, 'utf8');
  if (payload.length === 0) {
    falhar('PREFIXO_INVALIDO');
  }

  if (payload.length > limiteEfetivo) {
    falhar('TAMANHO_EXCEDIDO');
  }

  const cabecalho = Buffer.alloc(4);
  escreverComprimento(cabecalho, payload.length, ordem);
  return Buffer.concat([cabecalho, payload]);
}

export class DecodificadorEnquadramento {
  private readonly cabecalhoPendente = Buffer.alloc(4);
  private bytesCabecalhoRecebidos = 0;
  private payloadPendente: Buffer | null = null;
  private bytesPayloadRecebidos = 0;
  private encerrado = false;
  private readonly limitePayload: number;

  public constructor(
    private readonly ordem: OrdemBytes,
    limitePayload = LIMITE_PAYLOAD_CONTRATO
  ) {
    this.limitePayload = normalizarLimitePayload(limitePayload);
  }

  public adicionar(fragmento: Uint8Array): unknown[] {
    if (this.encerrado) {
      falhar('MENSAGEM_INVALIDA');
    }

    try {
      if (fragmento.byteLength > LIMITE_FRAGMENTO_PADRAO) {
        falhar('FRAGMENTO_EXCEDIDO');
      }

      return this.processar(fragmento);
    } catch (erro: unknown) {
      this.encerrado = true;
      this.limparEstado();
      throw erro;
    }
  }

  public finalizar(): void {
    try {
      if (this.payloadPendente !== null) {
        falhar('PAYLOAD_TRUNCADO');
      }

      if (this.bytesCabecalhoRecebidos > 0) {
        falhar('CABECALHO_INCOMPLETO');
      }
    } finally {
      this.encerrado = true;
      this.limparEstado();
    }
  }

  private processar(fragmento: Uint8Array): unknown[] {
    const mensagens: unknown[] = [];
    let posicao = 0;

    while (posicao < fragmento.byteLength) {
      if (mensagens.length >= LIMITE_MENSAGENS_POR_ADICAO) {
        falhar('LOTE_EXCEDIDO');
      }

      if (this.payloadPendente === null) {
        const quantidadeCabecalho = Math.min(
          4 - this.bytesCabecalhoRecebidos,
          fragmento.byteLength - posicao
        );
        this.cabecalhoPendente.set(
          fragmento.subarray(posicao, posicao + quantidadeCabecalho),
          this.bytesCabecalhoRecebidos
        );
        this.bytesCabecalhoRecebidos += quantidadeCabecalho;
        posicao += quantidadeCabecalho;

        if (this.bytesCabecalhoRecebidos < 4) {
          continue;
        }

        const comprimento = lerComprimento(this.cabecalhoPendente, this.ordem);
        this.bytesCabecalhoRecebidos = 0;

        if (comprimento === 0) {
          falhar('PREFIXO_INVALIDO');
        }

        if (comprimento > this.limitePayload) {
          falhar('TAMANHO_EXCEDIDO');
        }

        this.payloadPendente = Buffer.alloc(comprimento);
        this.bytesPayloadRecebidos = 0;
      }

      const payload = this.payloadPendente;
      if (payload === null) {
        continue;
      }

      const quantidadePayload = Math.min(
        payload.length - this.bytesPayloadRecebidos,
        fragmento.byteLength - posicao
      );
      payload.set(
        fragmento.subarray(posicao, posicao + quantidadePayload),
        this.bytesPayloadRecebidos
      );
      this.bytesPayloadRecebidos += quantidadePayload;
      posicao += quantidadePayload;

      if (this.bytesPayloadRecebidos === payload.length) {
        const mensagem = this.interpretarPayload(payload);
        this.payloadPendente = null;
        this.bytesPayloadRecebidos = 0;
        mensagens.push(mensagem);
      }
    }

    return mensagens;
  }

  private limparEstado(): void {
    this.bytesCabecalhoRecebidos = 0;
    this.payloadPendente = null;
    this.bytesPayloadRecebidos = 0;
  }

  private interpretarPayload(payload: Buffer): unknown {
    let texto: string;

    try {
      texto = new TextDecoder('utf-8', { fatal: true }).decode(payload);
    } catch {
      throw new ErroProtocolo('UTF8_INVALIDO');
    }

    try {
      return JSON.parse(texto) as unknown;
    } catch {
      throw new ErroProtocolo('JSON_INVALIDO');
    }
  }
}
