import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ErroProtocolo, type CodigoErroProtocolo } from '../src/errors.js';
import { CODIGOS_ERRO_MENSAGEM } from '../src/types.js';
import { validarMensagem } from '../src/validation.js';

const ID = 'requisicao-01';
const ID_SESSAO = 'sessao-01';
const NONCE_HOST = 'abcdefghijklmnopqrstuv';
const NONCE_CLIENTE = 'zyxwvutsrqponmlkjihgfe';
const PROVA = 'abcdefghijklmnopqrstuvwxyzABCDEFGH123456789';
const INSTANTE = '2026-10-14T12:00:00.000Z';

function esperarCodigo(codigo: CodigoErroProtocolo, operacao: () => unknown): void {
  assert.throws(operacao, (erro: unknown) => {
    assert.ok(erro instanceof ErroProtocolo);
    assert.equal(erro.codigo, codigo);
    return true;
  });
}

function desafio(): Record<string, unknown> {
  return {
    tipo: 'DESAFIO_AUTENTICACAO',
    idRequisicao: ID,
    versaoProtocolo: '1.0',
    nonceHost: NONCE_HOST,
    instanteHost: INSTANTE
  };
}

describe('schemas estritos e versionados', () => {
  it('aceita DESAFIO_AUTENTICACAO válido', () => {
    assert.deepEqual(validarMensagem(desafio()), desafio());
  });

  it('aceita AUTENTICAR válido', () => {
    const mensagem = {
      tipo: 'AUTENTICAR',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      idInstalacao: 'instalacao-01',
      nonceHost: NONCE_HOST,
      nonceCliente: NONCE_CLIENTE,
      instanteCliente: INSTANTE,
      provaCliente: PROVA
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita AUTENTICADO válido', () => {
    const mensagem = {
      tipo: 'AUTENTICADO',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      idSessao: ID_SESSAO,
      nonceHost: NONCE_HOST,
      nonceCliente: NONCE_CLIENTE,
      provaHost: PROVA
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita TESTAR_PONTE no trecho IDE para host', () => {
    const mensagem = {
      tipo: 'TESTAR_PONTE',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      idSessao: ID_SESSAO,
      origem: 'antigravity',
      destino: 'chrome',
      sequencia: 1,
      dados: { versaoExtensaoIde: '0.1.0', instanteEnvio: INSTANTE }
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita TESTAR_PONTE sanitizado no trecho host para Chrome', () => {
    const mensagem = {
      tipo: 'TESTAR_PONTE',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      origem: 'antigravity',
      destino: 'chrome',
      dados: { versaoExtensaoIde: '0.1.0', versaoHost: '0.2.0' }
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita PONTE_TESTADA válida', () => {
    const mensagem = {
      tipo: 'PONTE_TESTADA',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      origem: 'chrome',
      destino: 'antigravity',
      dados: {
        versaoExtensaoChrome: '0.2.0',
        versaoHost: '0.2.0',
        resultado: 'sucesso'
      }
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita ERRO válido com identificador nulo', () => {
    const mensagem = {
      tipo: 'ERRO',
      idRequisicao: null,
      versaoProtocolo: '1.0',
      erro: {
        codigo: 'CHROME_DESCONECTADO',
        mensagem: 'A extensão Chrome não está conectada ao host local.',
        repetivel: true
      }
    };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('aceita somente os códigos de erro funcionais congelados', () => {
    for (const codigo of CODIGOS_ERRO_MENSAGEM) {
      const mensagem = {
        tipo: 'ERRO',
        idRequisicao: null,
        versaoProtocolo: '1.0',
        erro: { codigo, mensagem: 'Falha controlada.', repetivel: false }
      };
      assert.deepEqual(validarMensagem(mensagem), mensagem);
    }

    esperarCodigo('VALOR_INVALIDO', () => validarMensagem({
      tipo: 'ERRO',
      idRequisicao: null,
      versaoProtocolo: '1.0',
      erro: { codigo: 'EXECUCAO_ARBITRARIA', mensagem: 'Negado.', repetivel: false }
    }));
  });

  it('rejeita tipos desconhecidos e operações funcionais proibidas', () => {
    for (const tipo of ['DESCONHECIDO', 'EXECUTAR_COMANDO', 'LER_CREDENCIAIS']) {
      esperarCodigo('TIPO_NAO_PERMITIDO', () => validarMensagem({ tipo }));
    }
  });

  it('rejeita campo obrigatório ausente', () => {
    const mensagem = desafio();
    delete mensagem.nonceHost;
    esperarCodigo('CAMPO_OBRIGATORIO_AUSENTE', () => validarMensagem(mensagem));
  });

  it('rejeita campo adicional no nível principal', () => {
    esperarCodigo('CAMPO_NAO_PERMITIDO', () => validarMensagem({
      ...desafio(),
      comando: 'não permitido'
    }));
  });

  it('rejeita operação adicional dentro de dados funcionais', () => {
    esperarCodigo('CAMPO_NAO_PERMITIDO', () => validarMensagem({
      tipo: 'TESTAR_PONTE',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      origem: 'antigravity',
      destino: 'chrome',
      dados: {
        versaoExtensaoIde: '0.1.0',
        versaoHost: '0.2.0',
        executarComando: 'calc.exe'
      }
    }));
  });

  it('rejeita versão incompatível', () => {
    esperarCodigo('VERSAO_INCOMPATIVEL', () => validarMensagem({
      ...desafio(),
      versaoProtocolo: '2.0'
    }));
  });

  it('rejeita identificadores vazios, com espaços ou caracteres não permitidos', () => {
    for (const idRequisicao of ['', 'com espaço', '../segredo', 'identificador/externo']) {
      esperarCodigo('IDENTIFICADOR_INVALIDO', () => validarMensagem({
        ...desafio(),
        idRequisicao
      }));
    }
  });

  it('rejeita identificador acima de 128 caracteres', () => {
    esperarCodigo('IDENTIFICADOR_INVALIDO', () => validarMensagem({
      ...desafio(),
      idRequisicao: `a${'b'.repeat(128)}`
    }));
  });

  it('aceita identificador com exatamente 128 caracteres', () => {
    const mensagem = { ...desafio(), idRequisicao: 'a'.repeat(128) };
    assert.deepEqual(validarMensagem(mensagem), mensagem);
  });

  it('rejeita payload de novo contrato acima de 64 KiB', () => {
    esperarCodigo('TAMANHO_EXCEDIDO', () => validarMensagem({
      ...desafio(),
      excesso: 'x'.repeat(65_536)
    }));
  });

  it('rejeita estruturas que não são objetos JSON', () => {
    for (const valor of [null, [], 'texto', 1, true]) {
      esperarCodigo('MENSAGEM_INVALIDA', () => validarMensagem(valor));
    }
  });

  it('rejeita valores temporais e semânticos inválidos', () => {
    esperarCodigo('VALOR_INVALIDO', () => validarMensagem({
      ...desafio(),
      instanteHost: '2026-02-30T12:00:00.000Z'
    }));
  });

  it('rejeita nonce e prova fora do formato estrutural', () => {
    esperarCodigo('VALOR_INVALIDO', () => validarMensagem({
      tipo: 'AUTENTICAR',
      idRequisicao: ID,
      versaoProtocolo: '1.0',
      idInstalacao: 'instalacao-01',
      nonceHost: 'curto',
      nonceCliente: NONCE_CLIENTE,
      instanteCliente: INSTANTE,
      provaCliente: PROVA
    }));
  });

  it('rejeita sequência não inteira ou menor que um', () => {
    for (const sequencia of [0, -1, 1.5]) {
      esperarCodigo('VALOR_INVALIDO', () => validarMensagem({
        tipo: 'TESTAR_PONTE',
        idRequisicao: ID,
        versaoProtocolo: '1.0',
        idSessao: ID_SESSAO,
        origem: 'antigravity',
        destino: 'chrome',
        sequencia,
        dados: { versaoExtensaoIde: '0.1.0', instanteEnvio: INSTANTE }
      }));
    }
  });
});
