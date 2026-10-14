const NOME_HOST = 'com.argonauta.poc05a';
const VERSAO_PROTOCOLO = '1.0';

const botaoTestar = document.querySelector('#botaoTestar');
const resultado = document.querySelector('.resultado');
const mensagemResultado = document.querySelector('#mensagemResultado');

function atualizarEstado(estado, mensagem) {
  resultado.dataset.estado = estado;
  mensagemResultado.textContent = mensagem;
}

function validarResposta(resposta, idRequisicao) {
  return (
    resposta?.tipo === 'PONG' &&
    resposta.idRequisicao === idRequisicao &&
    resposta.versaoProtocolo === VERSAO_PROTOCOLO
  );
}

function testarConexao() {
  const idRequisicao = crypto.randomUUID();
  const mensagem = {
    tipo: 'PING',
    idRequisicao,
    versaoProtocolo: VERSAO_PROTOCOLO,
  };

  botaoTestar.disabled = true;
  atualizarEstado('carregando', 'Conectando ao host local...');

  chrome.runtime.sendNativeMessage(NOME_HOST, mensagem, (resposta) => {
    botaoTestar.disabled = false;

    if (chrome.runtime.lastError) {
      atualizarEstado('erro', `Falha na conexão: ${chrome.runtime.lastError.message}`);
      return;
    }

    if (!validarResposta(resposta, idRequisicao)) {
      atualizarEstado('erro', 'O host retornou uma resposta inválida ou incompatível.');
      return;
    }

    atualizarEstado(
      'sucesso',
      `PONG recebido · protocolo ${resposta.versaoProtocolo} · host ${resposta.versaoHost}`,
    );
  });
}

botaoTestar.addEventListener('click', testarConexao);
