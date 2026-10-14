#include "servidor-pipe-nomeado.hpp"

#include <bcrypt.h>

#include <array>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <string_view>

namespace argonauta {
namespace {

inline constexpr std::size_t TAMANHO_MAXIMO_MENSAGEM = 64;
inline constexpr std::string_view PING_GATE = "PING_GATE";
inline constexpr std::string_view PONG_GATE = "PONG_GATE";
inline constexpr std::uint8_t CONFIRMACAO_RECEBIMENTO = 0x06;

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

ResultadoIo aguardarIoSobreposto(HANDLE handle, OVERLAPPED& sobreposto, DWORD tempoLimiteMs) {
    const DWORD espera = WaitForSingleObject(sobreposto.hEvent, tempoLimiteMs);
    if (espera == WAIT_OBJECT_0) {
        DWORD bytes = 0;
        if (GetOverlappedResult(handle, &sobreposto, &bytes, FALSE) != FALSE) {
            return {EstadoIo::Concluida, bytes, ERROR_SUCCESS};
        }
        const DWORD codigo = GetLastError();
        if (codigo == ERROR_BROKEN_PIPE || codigo == ERROR_NO_DATA) {
            return {EstadoIo::Desconectado, 0, codigo};
        }
        return {EstadoIo::Falha, 0, codigo};
    }

    if (espera != WAIT_TIMEOUT) {
        return {EstadoIo::Falha, 0, GetLastError()};
    }

    if (CancelIoEx(handle, &sobreposto) == FALSE && GetLastError() != ERROR_NOT_FOUND) {
        return {EstadoIo::Falha, 0, GetLastError()};
    }

    const DWORD esperaCancelamento = WaitForSingleObject(sobreposto.hEvent, tempoLimiteMs);
    if (esperaCancelamento != WAIT_OBJECT_0) {
        ExitProcess(3);
    }

    DWORD bytes = 0;
    if (GetOverlappedResult(handle, &sobreposto, &bytes, FALSE) != FALSE) {
        return {EstadoIo::TempoEsgotado, bytes, ERROR_SUCCESS};
    }
    const DWORD codigo = GetLastError();
    if (codigo == ERROR_OPERATION_ABORTED || codigo == ERROR_BROKEN_PIPE || codigo == ERROR_NO_DATA) {
        return {EstadoIo::TempoEsgotado, 0, codigo};
    }
    return {EstadoIo::Falha, 0, codigo};
}

template <typename Operacao>
ResultadoIo executarIoSobreposto(HANDLE handle, DWORD tempoLimiteMs, Operacao&& operacao) {
    HandleUnico evento(CreateEventW(nullptr, TRUE, FALSE, nullptr));
    if (!evento.valido()) {
        return {EstadoIo::Falha, 0, GetLastError()};
    }

    OVERLAPPED sobreposto{};
    sobreposto.hEvent = evento.obter();
    DWORD bytes = 0;
    if (operacao(&sobreposto, &bytes) != FALSE) {
        return {EstadoIo::Concluida, bytes, ERROR_SUCCESS};
    }

    const DWORD codigo = GetLastError();
    if (codigo == ERROR_BROKEN_PIPE || codigo == ERROR_NO_DATA) {
        return {EstadoIo::Desconectado, 0, codigo};
    }
    if (codigo != ERROR_IO_PENDING) {
        return {EstadoIo::Falha, 0, codigo};
    }
    return aguardarIoSobreposto(handle, sobreposto, tempoLimiteMs);
}

ResultadoIo conectar(HANDLE pipe, DWORD tempoLimiteMs) {
    HandleUnico evento(CreateEventW(nullptr, TRUE, FALSE, nullptr));
    if (!evento.valido()) {
        return {EstadoIo::Falha, 0, GetLastError()};
    }

    OVERLAPPED sobreposto{};
    sobreposto.hEvent = evento.obter();
    if (ConnectNamedPipe(pipe, &sobreposto) != FALSE) {
        return {EstadoIo::Concluida, 0, ERROR_SUCCESS};
    }

    const DWORD codigo = GetLastError();
    if (codigo == ERROR_PIPE_CONNECTED) {
        return {EstadoIo::Concluida, 0, ERROR_SUCCESS};
    }
    if (codigo != ERROR_IO_PENDING) {
        return {EstadoIo::Falha, 0, codigo};
    }
    return aguardarIoSobreposto(pipe, sobreposto, tempoLimiteMs);
}

ResultadoIo ler(HANDLE pipe, void* destino, DWORD tamanho, DWORD tempoLimiteMs) {
    return executarIoSobreposto(
        pipe,
        tempoLimiteMs,
        [pipe, destino, tamanho](OVERLAPPED* sobreposto, DWORD* bytes) {
            return ReadFile(pipe, destino, tamanho, bytes, sobreposto);
        });
}

ResultadoIo escrever(HANDLE pipe, const void* origem, DWORD tamanho, DWORD tempoLimiteMs) {
    return executarIoSobreposto(
        pipe,
        tempoLimiteMs,
        [pipe, origem, tamanho](OVERLAPPED* sobreposto, DWORD* bytes) {
            return WriteFile(pipe, origem, tamanho, bytes, sobreposto);
        });
}

std::wstring construirCaminho(const std::wstring& sufixo) {
    return L"\\\\.\\pipe\\LOCAL\\argonauta-ipc-security-probe-" + sufixo;
}

}  // namespace

std::wstring gerarSufixoCriptografico() {
    std::array<unsigned char, 16> bytes{};
    const NTSTATUS resultado = BCryptGenRandom(
        nullptr,
        bytes.data(),
        static_cast<ULONG>(bytes.size()),
        BCRYPT_USE_SYSTEM_PREFERRED_RNG);
    if (resultado < 0) {
        throw std::runtime_error("A geração criptográfica do nome temporário falhou.");
    }

    std::wostringstream saida;
    saida << std::hex << std::setfill(L'0');
    for (const unsigned char byte : bytes) {
        saida << std::setw(2) << static_cast<unsigned int>(byte);
    }
    return saida.str();
}

ServidorPipeNomeado::ServidorPipeNomeado(ACCESS_MASK mascara, const std::wstring& sufixoForcado)
    : identidade_(obterIdentidadeDoProcesso()),
      descritor_(identidade_.sidLogon, mascara),
      caminho_(construirCaminho(sufixoForcado.empty() ? gerarSufixoCriptografico() : sufixoForcado)) {
    const DWORD modoAbertura =
        PIPE_ACCESS_DUPLEX | FILE_FLAG_FIRST_PIPE_INSTANCE | FILE_FLAG_OVERLAPPED;
    const DWORD modoPipe =
        PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT | PIPE_REJECT_REMOTE_CLIENTS;

    pipe_.redefinir(CreateNamedPipeW(
        caminho_.c_str(),
        modoAbertura,
        modoPipe,
        1,
        256,
        256,
        1'500,
        descritor_.atributos()));
    if (!pipe_.valido()) {
        const DWORD codigo = GetLastError();
        throw ErroGate("A criação segura do primeiro handle do pipe foi bloqueada.", codigo);
    }

    inspecao_ = inspecionarSegurancaPipe(pipe_.obter(), identidade_, mascara);
    if (!inspecao_.estruturaAprovada()) {
        throw ErroGate("A inspeção efetiva do descritor de segurança foi reprovada.", ERROR_ACCESS_DENIED);
    }
}

const std::wstring& ServidorPipeNomeado::caminho() const noexcept {
    return caminho_;
}

const ResultadoInspecaoSeguranca& ServidorPipeNomeado::inspecao() const noexcept {
    return inspecao_;
}

ResultadoAtendimento ServidorPipeNomeado::atender(DWORD tempoLimiteMs) {
    ResultadoAtendimento resultado;
    const ResultadoIo conexao = conectar(pipe_.obter(), tempoLimiteMs);
    if (conexao.estado == EstadoIo::TempoEsgotado) {
        resultado.estado = EstadoAtendimento::TempoEsgotado;
        resultado.codigoWin32 = conexao.codigo;
        return resultado;
    }
    if (conexao.estado != EstadoIo::Concluida) {
        resultado.estado = EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = conexao.codigo;
        return resultado;
    }

    std::uint8_t tamanhoDeclarado = 0;
    const ResultadoIo leituraTamanho = ler(pipe_.obter(), &tamanhoDeclarado, 1, tempoLimiteMs);
    if (leituraTamanho.estado == EstadoIo::TempoEsgotado) {
        resultado.estado = EstadoAtendimento::TempoEsgotado;
        resultado.codigoWin32 = leituraTamanho.codigo;
        return resultado;
    }
    if (leituraTamanho.estado == EstadoIo::Desconectado) {
        resultado.estado = EstadoAtendimento::ClienteDesconectado;
        resultado.codigoWin32 = leituraTamanho.codigo;
        return resultado;
    }
    if (leituraTamanho.estado != EstadoIo::Concluida || leituraTamanho.bytes != 1 ||
        tamanhoDeclarado == 0 || tamanhoDeclarado > TAMANHO_MAXIMO_MENSAGEM) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        resultado.codigoWin32 = leituraTamanho.codigo;
        return resultado;
    }

    std::array<char, TAMANHO_MAXIMO_MENSAGEM> mensagem{};
    DWORD totalLido = 0;
    while (totalLido < tamanhoDeclarado) {
        const ResultadoIo leitura = ler(
            pipe_.obter(),
            mensagem.data() + totalLido,
            static_cast<DWORD>(tamanhoDeclarado - totalLido),
            tempoLimiteMs);
        if (leitura.estado == EstadoIo::TempoEsgotado) {
            resultado.estado = EstadoAtendimento::TempoEsgotado;
            resultado.codigoWin32 = leitura.codigo;
            return resultado;
        }
        if (leitura.estado == EstadoIo::Desconectado || leitura.bytes == 0) {
            resultado.estado = EstadoAtendimento::ClienteDesconectado;
            resultado.codigoWin32 = leitura.codigo;
            return resultado;
        }
        if (leitura.estado != EstadoIo::Concluida) {
            resultado.estado = EstadoAtendimento::FalhaIo;
            resultado.codigoWin32 = leitura.codigo;
            return resultado;
        }
        totalLido += leitura.bytes;
    }

    resultado.mensagemLidaAntesDaRepresentacao = true;
    resultado.bytesRecebidos = totalLido;
    resultado.clienteAutorizado = clientePertenceAoMesmoLogon(pipe_.obter(), identidade_.sidLogon);
    if (!resultado.clienteAutorizado) {
        resultado.estado = EstadoAtendimento::ClienteNaoAutorizado;
        return resultado;
    }

    DWORD bytesAdicionais = 0;
    if (PeekNamedPipe(pipe_.obter(), nullptr, 0, nullptr, &bytesAdicionais, nullptr) == FALSE) {
        resultado.estado = EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = GetLastError();
        return resultado;
    }
    if (bytesAdicionais != 0) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        return resultado;
    }

    // Janela de observação para detectar frames adicionais que cheguem assincronamente
    // logo após a leitura inicial, impedindo qualquer resposta caso haja dados espúrios a caminho.
    constexpr DWORD JANELA_INSPECAO_BYTES_MS = 35;
    std::uint8_t byteSobressalente = 0;
    const ResultadoIo inspecaoSobressalente = ler(
        pipe_.obter(),
        &byteSobressalente,
        1,
        JANELA_INSPECAO_BYTES_MS);
    if (inspecaoSobressalente.estado == EstadoIo::Concluida && inspecaoSobressalente.bytes > 0) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        return resultado;
    }
    if (inspecaoSobressalente.estado == EstadoIo::Desconectado) {
        resultado.estado = EstadoAtendimento::ClienteDesconectado;
        resultado.codigoWin32 = inspecaoSobressalente.codigo;
        return resultado;
    }
    if (inspecaoSobressalente.estado == EstadoIo::Falha) {
        resultado.estado = EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = inspecaoSobressalente.codigo;
        return resultado;
    }

    DWORD bytesRestantes = 0;
    if (PeekNamedPipe(pipe_.obter(), nullptr, 0, nullptr, &bytesRestantes, nullptr) == FALSE) {
        resultado.estado = EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = GetLastError();
        return resultado;
    }
    if (bytesRestantes != 0) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        return resultado;
    }

    const std::string_view mensagemRecebida(mensagem.data(), totalLido);
    if (mensagemRecebida != PING_GATE) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        return resultado;
    }

    const ResultadoIo escrita = escrever(
        pipe_.obter(),
        PONG_GATE.data(),
        static_cast<DWORD>(PONG_GATE.size()),
        tempoLimiteMs);
    if (escrita.estado != EstadoIo::Concluida || escrita.bytes != PONG_GATE.size()) {
        resultado.estado = escrita.estado == EstadoIo::TempoEsgotado
            ? EstadoAtendimento::TempoEsgotado
            : EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = escrita.codigo;
        return resultado;
    }

    resultado.respostaEnviada = true;
    std::uint8_t confirmacao = 0;
    const ResultadoIo leituraConfirmacao = ler(
        pipe_.obter(),
        &confirmacao,
        1,
        tempoLimiteMs);
    if (leituraConfirmacao.estado != EstadoIo::Concluida ||
        leituraConfirmacao.bytes != 1 || confirmacao != CONFIRMACAO_RECEBIMENTO) {
        resultado.estado = leituraConfirmacao.estado == EstadoIo::TempoEsgotado
            ? EstadoAtendimento::TempoEsgotado
            : EstadoAtendimento::FalhaIo;
        resultado.codigoWin32 = leituraConfirmacao.codigo;
        return resultado;
    }

    DWORD bytesAposConfirmacao = 0;
    if (PeekNamedPipe(pipe_.obter(), nullptr, 0, nullptr, &bytesAposConfirmacao, nullptr) != FALSE &&
        bytesAposConfirmacao != 0) {
        resultado.estado = EstadoAtendimento::MensagemInvalida;
        DisconnectNamedPipe(pipe_.obter());
        return resultado;
    }

    resultado.estado = EstadoAtendimento::Sucesso;
    DisconnectNamedPipe(pipe_.obter());
    return resultado;
}

}  // namespace argonauta
