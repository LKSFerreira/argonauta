#pragma once

#include "recurso-win32.hpp"
#include "seguranca-logon.hpp"

#include <windows.h>

#include <cstdint>
#include <stdexcept>
#include <string>

namespace argonauta {

class ErroGate final : public std::runtime_error {
public:
    ErroGate(const std::string& mensagem, DWORD codigoWin32)
        : std::runtime_error(mensagem), codigoWin32_(codigoWin32) {}

    [[nodiscard]] DWORD codigoWin32() const noexcept {
        return codigoWin32_;
    }

private:
    DWORD codigoWin32_;
};

enum class EstadoAtendimento {
    Sucesso,
    TempoEsgotado,
    ClienteDesconectado,
    MensagemInvalida,
    ClienteNaoAutorizado,
    FalhaIo,
};

struct ResultadoAtendimento final {
    EstadoAtendimento estado{EstadoAtendimento::FalhaIo};
    bool mensagemLidaAntesDaRepresentacao{false};
    bool clienteAutorizado{false};
    bool respostaEnviada{false};
    std::uint32_t bytesRecebidos{0};
    DWORD codigoWin32{ERROR_SUCCESS};
};

class ServidorPipeNomeado final {
public:
    ServidorPipeNomeado(ACCESS_MASK mascara, const std::wstring& sufixoForcado = L"");

    [[nodiscard]] const std::wstring& caminho() const noexcept;
    [[nodiscard]] const ResultadoInspecaoSeguranca& inspecao() const noexcept;
    [[nodiscard]] ResultadoAtendimento atender(DWORD tempoLimiteMs);

private:
    IdentidadeProcesso identidade_;
    DescritorSegurancaPipe descritor_;
    std::wstring caminho_;
    HandleUnico pipe_;
    ResultadoInspecaoSeguranca inspecao_;
};

[[nodiscard]] std::wstring gerarSufixoCriptografico();

}  // namespace argonauta
