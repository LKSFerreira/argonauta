#pragma once

#include <windows.h>

namespace argonauta {

enum class EstadoIo {
    Concluida,
    TempoEsgotado,
    Desconectado,
    Falha,
};

struct ResultadoIo final {
    EstadoIo estado{EstadoIo::Falha};
    DWORD bytes{0};
    DWORD codigo{ERROR_SUCCESS};
};

[[nodiscard]] inline ResultadoIo classificarConclusaoIo(
    BOOL concluiuComSucesso,
    DWORD bytesTransferidos,
    DWORD codigoErro,
    bool aposTimeout) noexcept {
    if (concluiuComSucesso != FALSE) {
        return {EstadoIo::Concluida, bytesTransferidos, ERROR_SUCCESS};
    }
    if (codigoErro == ERROR_BROKEN_PIPE || codigoErro == ERROR_NO_DATA) {
        return {EstadoIo::Desconectado, 0, codigoErro};
    }
    if (aposTimeout && codigoErro == ERROR_OPERATION_ABORTED) {
        return {EstadoIo::TempoEsgotado, 0, codigoErro};
    }
    return {EstadoIo::Falha, 0, codigoErro};
}

}  // namespace argonauta
