#include "seguranca-logon.hpp"
#include "servidor-pipe-nomeado.hpp"

#include <windows.h>

#include <algorithm>
#include <charconv>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>

namespace {

struct Opcoes final {
    ACCESS_MASK mascara{argonauta::MASCARA_ESTRITA};
    std::string politica{"estrita"};
    std::wstring sufixo;
    DWORD tempoLimiteMs{1'500};
};

std::string paraUtf8(const std::wstring& valor) {
    if (valor.empty()) {
        return {};
    }
    const int tamanho = WideCharToMultiByte(
        CP_UTF8,
        WC_ERR_INVALID_CHARS,
        valor.data(),
        static_cast<int>(valor.size()),
        nullptr,
        0,
        nullptr,
        nullptr);
    if (tamanho <= 0) {
        throw std::runtime_error("A conversão UTF-8 do nome temporário falhou.");
    }
    std::string saida(static_cast<std::size_t>(tamanho), '\0');
    if (WideCharToMultiByte(
            CP_UTF8,
            WC_ERR_INVALID_CHARS,
            valor.data(),
            static_cast<int>(valor.size()),
            saida.data(),
            tamanho,
            nullptr,
            nullptr) != tamanho) {
        throw std::runtime_error("A conversão UTF-8 do nome temporário ficou incompleta.");
    }
    return saida;
}

std::string escaparJson(std::string_view valor) {
    std::string saida;
    saida.reserve(valor.size() + 8);
    for (const char caractere : valor) {
        switch (caractere) {
            case '\\':
                saida += "\\\\";
                break;
            case '"':
                saida += "\\\"";
                break;
            default:
                saida += caractere;
                break;
        }
    }
    return saida;
}

std::string mascaraHexadecimal(ACCESS_MASK mascara) {
    std::ostringstream saida;
    saida << "0x" << std::uppercase << std::hex << std::setw(8) << std::setfill('0') << mascara;
    return saida.str();
}

bool sufixoValido(std::string_view sufixo) {
    return sufixo.size() == 32 && std::all_of(sufixo.begin(), sufixo.end(), [](char caractere) {
        return (caractere >= '0' && caractere <= '9') ||
            (caractere >= 'a' && caractere <= 'f');
    });
}

std::wstring paraUtf16Ascii(std::string_view valor) {
    return std::wstring(valor.begin(), valor.end());
}

Opcoes lerOpcoes(int quantidade, char** argumentos) {
    Opcoes opcoes;
    for (int indice = 1; indice < quantidade; ++indice) {
        const std::string_view argumento(argumentos[indice]);
        if (argumento == "--politica" && indice + 1 < quantidade) {
            opcoes.politica = argumentos[++indice];
            if (opcoes.politica == "estrita") {
                opcoes.mascara = argonauta::MASCARA_ESTRITA;
            } else if (opcoes.politica == "compatibilidade-node") {
                opcoes.mascara = argonauta::MASCARA_COMPATIVEL_NODE;
            } else {
                throw std::invalid_argument("A política de acesso informada não é reconhecida.");
            }
            continue;
        }
        if (argumento == "--sufixo" && indice + 1 < quantidade) {
            const std::string_view sufixo(argumentos[++indice]);
            if (!sufixoValido(sufixo)) {
                throw std::invalid_argument("O sufixo de teste deve conter exatamente 32 caracteres hexadecimais minúsculos.");
            }
            opcoes.sufixo = paraUtf16Ascii(sufixo);
            continue;
        }
        if (argumento == "--mascara-hex" && indice + 1 < quantidade) {
            const std::string_view texto(argumentos[++indice]);
            std::uint32_t valor = 0;
            if (texto.size() != 10 || texto.substr(0, 2) != "0x") {
                throw std::invalid_argument("A máscara diagnóstica deve usar o formato 0x00000000.");
            }
            const auto conversao = std::from_chars(
                texto.data() + 2,
                texto.data() + texto.size(),
                valor,
                16);
            if (conversao.ec != std::errc{} || conversao.ptr != texto.data() + texto.size()) {
                throw std::invalid_argument("A máscara diagnóstica contém caracteres inválidos.");
            }
            if ((valor & ~argonauta::MASCARA_ESTRITA) != 0) {
                throw std::invalid_argument("A máscara diagnóstica não pode acrescentar direitos à política estrita.");
            }
            opcoes.mascara = valor;
            opcoes.politica = "mascara-diagnostica";
            continue;
        }
        if (argumento == "--timeout-ms" && indice + 1 < quantidade) {
            const std::string_view texto(argumentos[++indice]);
            std::uint32_t valor = 0;
            const auto conversao = std::from_chars(texto.data(), texto.data() + texto.size(), valor);
            if (conversao.ec != std::errc{} || conversao.ptr != texto.data() + texto.size() ||
                valor < 250 || valor > 10'000) {
                throw std::invalid_argument("O timeout deve estar entre 250 e 10000 milissegundos.");
            }
            opcoes.tempoLimiteMs = valor;
            continue;
        }
        throw std::invalid_argument("Foi informado um argumento não reconhecido pelo probe.");
    }
    return opcoes;
}

std::string nomeEstado(argonauta::EstadoAtendimento estado) {
    switch (estado) {
        case argonauta::EstadoAtendimento::Sucesso:
            return "sucesso";
        case argonauta::EstadoAtendimento::TempoEsgotado:
            return "tempo_esgotado";
        case argonauta::EstadoAtendimento::ClienteDesconectado:
            return "cliente_desconectado";
        case argonauta::EstadoAtendimento::MensagemInvalida:
            return "mensagem_invalida";
        case argonauta::EstadoAtendimento::ClienteNaoAutorizado:
            return "cliente_nao_autorizado";
        case argonauta::EstadoAtendimento::FalhaIo:
            return "falha_io";
    }
    return "estado_desconhecido";
}

void emitirProntidao(
    const Opcoes& opcoes,
    const argonauta::ServidorPipeNomeado& servidor) {
    const auto& inspecao = servidor.inspecao();
    const std::string caminho = escaparJson(paraUtf8(servidor.caminho()));
    std::cout
        << "{\"evento\":\"PRONTO_DIAGNOSTICO\","
        << "\"estadoGate\":\""
        << (inspecao.mascaraIncluiCriarInstancia ? "blocked" : "em_medicao") << "\","
        << "\"politica\":\"" << opcoes.politica << "\","
        << "\"caminhoPipe\":\"" << caminho << "\","
        << "\"descritorAntesDaCriacao\":true,"
        << "\"daclPresente\":" << (inspecao.daclPresente ? "true" : "false") << ','
        << "\"daclNaoNula\":" << (inspecao.daclNaoNula ? "true" : "false") << ','
        << "\"daclProtegida\":" << (inspecao.daclProtegida ? "true" : "false") << ','
        << "\"quantidadeAces\":" << inspecao.quantidadeAces << ','
        << "\"aceSidLogon\":" << (inspecao.sidAceEhLogon ? "true" : "false") << ','
        << "\"semPrincipaisProibidos\":" << (inspecao.semPrincipaisProibidos ? "true" : "false") << ','
        << "\"mascara\":\"" << mascaraHexadecimal(inspecao.mascaraObservada) << "\","
        << "\"incluiFileCreatePipeInstance\":"
        << (inspecao.mascaraIncluiCriarInstancia ? "true" : "false") << ','
        << "\"handleNaoHerdavel\":" << (inspecao.handleNaoHerdavel ? "true" : "false") << ','
        << "\"proprietarioConformePolitica\":"
        << (inspecao.proprietarioEsperado ? "true" : "false") << ','
        << "\"grupoConformePolitica\":" << (inspecao.grupoEsperado ? "true" : "false")
        << '}' << std::endl;
}

int executar(const Opcoes& opcoes) {
    argonauta::ServidorPipeNomeado servidor(opcoes.mascara, opcoes.sufixo);
    emitirProntidao(opcoes, servidor);

    const argonauta::ResultadoAtendimento resultado = servidor.atender(opcoes.tempoLimiteMs);
    const bool direitoAdicional = servidor.inspecao().mascaraIncluiCriarInstancia;
    const bool sucessoTecnico = resultado.estado == argonauta::EstadoAtendimento::Sucesso;
    const bool aprovado = sucessoTecnico && !direitoAdicional;
    const bool bloqueado = direitoAdicional ||
        (opcoes.politica == "estrita" && resultado.estado == argonauta::EstadoAtendimento::TempoEsgotado);

    std::cout
        << "{\"evento\":\"RESULTADO\","
        << "\"estado\":\"" << (aprovado ? "pass" : (bloqueado ? "blocked" : "fail")) << "\","
        << "\"atendimento\":\"" << nomeEstado(resultado.estado) << "\","
        << "\"mensagemLidaAntesDaRepresentacao\":"
        << (resultado.mensagemLidaAntesDaRepresentacao ? "true" : "false") << ','
        << "\"clienteAutorizado\":" << (resultado.clienteAutorizado ? "true" : "false") << ','
        << "\"respostaEnviada\":" << (resultado.respostaEnviada ? "true" : "false") << ','
        << "\"bytesRecebidos\":" << resultado.bytesRecebidos << ','
        << "\"codigoWin32\":" << resultado.codigoWin32
        << '}' << std::endl;

    if (aprovado) {
        return 0;
    }
    return bloqueado ? 2 : 3;
}

}  // namespace

int main(int quantidade, char** argumentos) {
    try {
        return executar(lerOpcoes(quantidade, argumentos));
    } catch (const argonauta::ErroGate& erro) {
        std::cout
            << "{\"evento\":\"RESULTADO\",\"estado\":\"blocked\","
            << "\"motivo\":\"criacao_ou_inspecao_segura_reprovada\","
            << "\"codigoWin32\":" << erro.codigoWin32() << '}' << std::endl;
        return 2;
    } catch (const std::exception&) {
        std::cout
            << "{\"evento\":\"RESULTADO\",\"estado\":\"fail\","
            << "\"motivo\":\"falha_de_execucao_sanitizada\"}" << std::endl;
        return 3;
    }
}
