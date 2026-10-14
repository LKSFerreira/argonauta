declare module '@argonauta/native-messaging-smoke/protocol' {
  export function serializarMensagem(mensagem: unknown, ordem: 'LE' | 'BE'): Buffer;

  export class DecodificadorMensagensNativas {
    public constructor(
      aoDecodificar: (mensagem: unknown) => void,
      ordem: 'LE' | 'BE'
    );

    public receber(parte: Buffer): void;
    public finalizar(): void;
  }
}

declare module '@argonauta/native-messaging-smoke/messages' {
  export function processarMensagem(mensagem: unknown): unknown;
}
