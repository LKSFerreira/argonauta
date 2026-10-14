import { ErroProtocolo, falhar } from './erros.js';
import { LIMITE_PAYLOAD_CONTRATO } from './tipos.js';

export type OrdemBytes = 'LE' | 'BE';

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

export function serializarEnquadramento(
  valor: unknown,
  ordem: OrdemBytes,
  limitePayload = LIMITE_PAYLOAD_CONTRATO
): Buffer {
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

  if (payload.length > limitePayload) {
    falhar('TAMANHO_EXCEDIDO');
  }

  const cabecalho = Buffer.alloc(4);
  escreverComprimento(cabecalho, payload.length, ordem);
  return Buffer.concat([cabecalho, payload]);
}

export class DecodificadorEnquadramento {
  private bufferPendente = Buffer.alloc(0);
  private comprimentoEsperado: number | null = null;
  private encerrado = false;

  public constructor(
    private readonly ordem: OrdemBytes,
    private readonly limitePayload = LIMITE_PAYLOAD_CONTRATO
  ) {}

  public adicionar(fragmento: Uint8Array): unknown[] {
    if (this.encerrado) {
      falhar('MENSAGEM_INVALIDA');
    }

    try {
      this.bufferPendente = Buffer.concat([
        this.bufferPendente,
        Buffer.from(fragmento)
      ]);
      return this.processar();
    } catch (erro: unknown) {
      this.encerrado = true;
      throw erro;
    }
  }

  public finalizar(): void {
    try {
      if (this.comprimentoEsperado !== null) {
        falhar('PAYLOAD_TRUNCADO');
      }

      if (this.bufferPendente.length > 0) {
        falhar('CABECALHO_INCOMPLETO');
      }
    } finally {
      this.encerrado = true;
    }
  }

  private processar(): unknown[] {
    const mensagens: unknown[] = [];

    while (true) {
      if (this.comprimentoEsperado === null) {
        if (this.bufferPendente.length < 4) {
          break;
        }

        const cabecalho = this.bufferPendente.subarray(0, 4);
        const comprimento = lerComprimento(cabecalho, this.ordem);
        this.bufferPendente = this.bufferPendente.subarray(4);

        if (comprimento === 0) {
          falhar('PREFIXO_INVALIDO');
        }

        if (comprimento > this.limitePayload) {
          falhar('TAMANHO_EXCEDIDO');
        }

        this.comprimentoEsperado = comprimento;
      }

      if (this.bufferPendente.length < this.comprimentoEsperado) {
        break;
      }

      const payload = this.bufferPendente.subarray(0, this.comprimentoEsperado);
      this.bufferPendente = this.bufferPendente.subarray(this.comprimentoEsperado);
      this.comprimentoEsperado = null;
      mensagens.push(this.interpretarPayload(payload));
    }

    return mensagens;
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
