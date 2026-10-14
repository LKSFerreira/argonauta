#include "../src/classificacao-io.hpp"

#include <array>
#include <cstring>
#include <iostream>

namespace {

struct CasoClassificacao final {
    const char* nome;
    BOOL concluiuComSucesso;
    DWORD bytesTransferidos;
    DWORD codigoErro;
    bool aposTimeout;
    argonauta::EstadoIo estadoEsperado;
    DWORD bytesEsperados;
    DWORD codigoEsperado;
};

constexpr std::array<CasoClassificacao, 9> CASOS{{
    {"conclusao_antes_timeout", TRUE, 9, ERROR_SUCCESS, false,
     argonauta::EstadoIo::Concluida, 9, ERROR_SUCCESS},
    {"conclusao_apos_timeout", TRUE, 9, ERROR_SUCCESS, true,
     argonauta::EstadoIo::Concluida, 9, ERROR_SUCCESS},
    {"conclusao_zero_byte_apos_timeout", TRUE, 0, ERROR_SUCCESS, true,
     argonauta::EstadoIo::Concluida, 0, ERROR_SUCCESS},
    {"cancelamento_confirmado", FALSE, 0, ERROR_OPERATION_ABORTED, true,
     argonauta::EstadoIo::TempoEsgotado, 0, ERROR_OPERATION_ABORTED},
    {"desconexao_apos_timeout", FALSE, 0, ERROR_BROKEN_PIPE, true,
     argonauta::EstadoIo::Desconectado, 0, ERROR_BROKEN_PIPE},
    {"desconexao_sem_timeout", FALSE, 0, ERROR_NO_DATA, false,
     argonauta::EstadoIo::Desconectado, 0, ERROR_NO_DATA},
    {"falha_apos_timeout", FALSE, 0, ERROR_ACCESS_DENIED, true,
     argonauta::EstadoIo::Falha, 0, ERROR_ACCESS_DENIED},
    {"cancelamento_inesperado", FALSE, 0, ERROR_OPERATION_ABORTED, false,
     argonauta::EstadoIo::Falha, 0, ERROR_OPERATION_ABORTED},
    {"desconexao_no_data_apos_timeout", FALSE, 0, ERROR_NO_DATA, true,
     argonauta::EstadoIo::Desconectado, 0, ERROR_NO_DATA},
}};

}  // namespace

int main(int quantidadeArgumentos, char** argumentos) {
    if (quantidadeArgumentos != 2) {
        std::cerr << "É necessário informar um cenário de classificação.\n";
        return 3;
    }

    for (const auto& caso : CASOS) {
        if (std::strcmp(argumentos[1], caso.nome) != 0) {
            continue;
        }
        const auto resultado = argonauta::classificarConclusaoIo(
            caso.concluiuComSucesso,
            caso.bytesTransferidos,
            caso.codigoErro,
            caso.aposTimeout);
        if (resultado.estado != caso.estadoEsperado ||
            resultado.bytes != caso.bytesEsperados ||
            resultado.codigo != caso.codigoEsperado) {
            std::cerr << "Classificação reprovada: " << caso.nome << '\n';
            return 1;
        }
        return 0;
    }

    std::cerr << "Cenário de classificação desconhecido.\n";
    return 3;
}
