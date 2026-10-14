#include "seguranca-logon.hpp"

#include "recurso-win32.hpp"

#include <aclapi.h>

#include <array>
#include <stdexcept>
#include <string>
#include <utility>

namespace argonauta {
namespace {

[[noreturn]] void falharWin32(const std::string& operacao) {
    throw std::runtime_error(operacao + " falhou com código Win32 " + std::to_string(GetLastError()) + ".");
}

std::vector<std::byte> obterInformacaoToken(HANDLE token, TOKEN_INFORMATION_CLASS classe) {
    DWORD tamanho = 0;
    if (GetTokenInformation(token, classe, nullptr, 0, &tamanho) != FALSE ||
        GetLastError() != ERROR_INSUFFICIENT_BUFFER || tamanho == 0) {
        falharWin32("A consulta do tamanho da informação do token");
    }

    std::vector<std::byte> buffer(tamanho);
    if (GetTokenInformation(token, classe, buffer.data(), tamanho, &tamanho) == FALSE) {
        falharWin32("A leitura da informação do token");
    }
    return buffer;
}

SidCopiado copiarSid(PSID sid) {
    if (sid == nullptr || IsValidSid(sid) == FALSE) {
        throw std::runtime_error("O SID informado é inválido.");
    }

    const DWORD tamanho = GetLengthSid(sid);
    std::vector<std::byte> bytes(tamanho);
    if (CopySid(tamanho, bytes.data(), sid) == FALSE) {
        falharWin32("A cópia do SID");
    }
    return SidCopiado(std::move(bytes));
}

SidCopiado obterSidUnico(HANDLE token, TOKEN_INFORMATION_CLASS classe) {
    auto buffer = obterInformacaoToken(token, classe);
    switch (classe) {
        case TokenUser:
            return copiarSid(reinterpret_cast<TOKEN_USER*>(buffer.data())->User.Sid);
        case TokenOwner:
            return copiarSid(reinterpret_cast<TOKEN_OWNER*>(buffer.data())->Owner);
        case TokenPrimaryGroup:
            return copiarSid(reinterpret_cast<TOKEN_PRIMARY_GROUP*>(buffer.data())->PrimaryGroup);
        default:
            throw std::runtime_error("Classe de informação de token não suportada pelo probe.");
    }
}

bool sidEhBemConhecido(PSID sid, WELL_KNOWN_SID_TYPE tipo) {
    std::array<std::byte, SECURITY_MAX_SID_SIZE> buffer{};
    DWORD tamanho = static_cast<DWORD>(buffer.size());
    if (CreateWellKnownSid(tipo, nullptr, buffer.data(), &tamanho) == FALSE) {
        falharWin32("A criação do SID conhecido para inspeção");
    }
    return EqualSid(sid, buffer.data()) != FALSE;
}

bool sidEhPrincipalProibido(PSID sid, const IdentidadeProcesso& identidade) {
    return EqualSid(sid, identidade.sidUsuario.obter()) != FALSE ||
        sidEhBemConhecido(sid, WinWorldSid) ||
        sidEhBemConhecido(sid, WinAnonymousSid) ||
        sidEhBemConhecido(sid, WinBuiltinUsersSid) ||
        sidEhBemConhecido(sid, WinAuthenticatedUserSid) ||
        sidEhBemConhecido(sid, WinBuiltinAdministratorsSid);
}

}  // namespace

PSID SidCopiado::obter() noexcept {
    return bytes_.empty() ? nullptr : bytes_.data();
}

PSID SidCopiado::obter() const noexcept {
    return bytes_.empty() ? nullptr : const_cast<std::byte*>(bytes_.data());
}

bool SidCopiado::valido() const noexcept {
    return obter() != nullptr && IsValidSid(obter()) != FALSE;
}

DescritorSegurancaPipe::DescritorSegurancaPipe(const SidCopiado& sidLogon, ACCESS_MASK mascara)
    : mascara_(mascara) {
    if (!sidLogon.valido()) {
        throw std::runtime_error("O SID de logon não está disponível para construir a DACL.");
    }

    const DWORD tamanhoSid = GetLengthSid(sidLogon.obter());
    const DWORD tamanhoAcl = static_cast<DWORD>(
        sizeof(ACL) + sizeof(ACCESS_ALLOWED_ACE) - sizeof(DWORD) + tamanhoSid);
    acl_.resize(tamanhoAcl);

    auto* acl = reinterpret_cast<PACL>(acl_.data());
    if (InitializeAcl(acl, tamanhoAcl, ACL_REVISION) == FALSE) {
        falharWin32("A inicialização da DACL");
    }
    if (AddAccessAllowedAceEx(acl, ACL_REVISION, 0, mascara_, sidLogon.obter()) == FALSE) {
        falharWin32("A inclusão da ACE do SID de logon");
    }
    if (InitializeSecurityDescriptor(&descritor_, SECURITY_DESCRIPTOR_REVISION) == FALSE) {
        falharWin32("A inicialização do descritor de segurança");
    }
    if (SetSecurityDescriptorDacl(&descritor_, TRUE, acl, FALSE) == FALSE) {
        falharWin32("A associação da DACL ao descritor de segurança");
    }
    if (SetSecurityDescriptorControl(&descritor_, SE_DACL_PROTECTED, SE_DACL_PROTECTED) == FALSE) {
        falharWin32("A proteção da DACL contra herança");
    }

    atributos_.nLength = sizeof(SECURITY_ATTRIBUTES);
    atributos_.lpSecurityDescriptor = &descritor_;
    atributos_.bInheritHandle = FALSE;
}

SECURITY_ATTRIBUTES* DescritorSegurancaPipe::atributos() noexcept {
    return &atributos_;
}

ACCESS_MASK DescritorSegurancaPipe::mascara() const noexcept {
    return mascara_;
}

bool ResultadoInspecaoSeguranca::estruturaAprovada() const noexcept {
    return daclPresente && daclNaoNula && daclProtegida && daclNaoPadrao &&
        umaAceExplicita && acePermitida && aceNaoHerdada && sidAceEhLogon &&
        semPrincipaisProibidos && mascaraExata && semDireitosCriticos &&
        handleNaoHerdavel && proprietarioEsperado && grupoEsperado;
}

SidCopiado obterSidLogonDoToken(HANDLE token) {
    auto buffer = obterInformacaoToken(token, TokenGroups);
    auto* grupos = reinterpret_cast<TOKEN_GROUPS*>(buffer.data());
    PSID encontrado = nullptr;
    DWORD quantidade = 0;

    for (DWORD indice = 0; indice < grupos->GroupCount; ++indice) {
        const auto& grupo = grupos->Groups[indice];
        if ((grupo.Attributes & SE_GROUP_LOGON_ID) == SE_GROUP_LOGON_ID) {
            encontrado = grupo.Sid;
            ++quantidade;
        }
    }

    if (quantidade != 1 || encontrado == nullptr) {
        throw std::runtime_error("O token não contém exatamente um SID de logon válido.");
    }
    return copiarSid(encontrado);
}

IdentidadeProcesso obterIdentidadeDoProcesso() {
    HANDLE tokenBruto = nullptr;
    if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &tokenBruto) == FALSE) {
        falharWin32("A abertura do token do processo");
    }
    HandleUnico token(tokenBruto);

    return IdentidadeProcesso{
        obterSidLogonDoToken(token.obter()),
        obterSidUnico(token.obter(), TokenUser),
        obterSidUnico(token.obter(), TokenOwner),
        obterSidUnico(token.obter(), TokenPrimaryGroup),
    };
}

ResultadoInspecaoSeguranca inspecionarSegurancaPipe(
    HANDLE pipe,
    const IdentidadeProcesso& identidade,
    ACCESS_MASK mascaraEsperada) {
    PSID proprietario = nullptr;
    PSID grupo = nullptr;
    PACL daclRetornada = nullptr;
    PSECURITY_DESCRIPTOR descritorBruto = nullptr;

    const DWORD resultado = GetSecurityInfo(
        pipe,
        SE_KERNEL_OBJECT,
        OWNER_SECURITY_INFORMATION | GROUP_SECURITY_INFORMATION | DACL_SECURITY_INFORMATION,
        &proprietario,
        &grupo,
        &daclRetornada,
        nullptr,
        &descritorBruto);
    if (resultado != ERROR_SUCCESS || descritorBruto == nullptr) {
        SetLastError(resultado);
        falharWin32("A inspeção do descritor efetivo do pipe");
    }
    MemoriaLocal memoriaDescritor(descritorBruto);

    ResultadoInspecaoSeguranca inspecao;
    BOOL daclPresente = FALSE;
    BOOL daclPadrao = TRUE;
    PACL dacl = nullptr;
    if (GetSecurityDescriptorDacl(descritorBruto, &daclPresente, &dacl, &daclPadrao) == FALSE) {
        falharWin32("A leitura da DACL efetiva do pipe");
    }
    inspecao.daclPresente = daclPresente != FALSE;
    inspecao.daclNaoNula = dacl != nullptr && dacl == daclRetornada;
    inspecao.daclNaoPadrao = daclPadrao == FALSE;

    SECURITY_DESCRIPTOR_CONTROL controle = 0;
    DWORD revisao = 0;
    if (GetSecurityDescriptorControl(descritorBruto, &controle, &revisao) == FALSE) {
        falharWin32("A leitura dos controles do descritor efetivo");
    }
    inspecao.daclProtegida =
        (controle & SE_DACL_PRESENT) != 0 && (controle & SE_DACL_PROTECTED) != 0;

    inspecao.proprietarioEsperado = proprietario != nullptr &&
        EqualSid(proprietario, identidade.sidProprietario.obter()) != FALSE;
    inspecao.grupoEsperado = grupo != nullptr &&
        EqualSid(grupo, identidade.sidGrupoPrimario.obter()) != FALSE;

    if (inspecao.daclNaoNula) {
        ACL_SIZE_INFORMATION informacaoAcl{};
        if (GetAclInformation(dacl, &informacaoAcl, sizeof(informacaoAcl), AclSizeInformation) == FALSE) {
            falharWin32("A leitura da quantidade de ACEs");
        }
        inspecao.quantidadeAces = informacaoAcl.AceCount;
        inspecao.umaAceExplicita = informacaoAcl.AceCount == 1;

        if (informacaoAcl.AceCount == 1) {
            void* aceBruta = nullptr;
            if (GetAce(dacl, 0, &aceBruta) == FALSE || aceBruta == nullptr) {
                falharWin32("A leitura da ACE efetiva");
            }
            auto* cabecalho = static_cast<ACE_HEADER*>(aceBruta);
            inspecao.acePermitida = cabecalho->AceType == ACCESS_ALLOWED_ACE_TYPE;
            inspecao.aceNaoHerdada = (cabecalho->AceFlags & INHERITED_ACE) == 0;

            if (inspecao.acePermitida) {
                auto* ace = static_cast<ACCESS_ALLOWED_ACE*>(aceBruta);
                PSID sidAce = &ace->SidStart;
                inspecao.mascaraObservada = ace->Mask;
                inspecao.sidAceEhLogon = IsValidSid(sidAce) != FALSE &&
                    EqualSid(sidAce, identidade.sidLogon.obter()) != FALSE;
                inspecao.semPrincipaisProibidos = IsValidSid(sidAce) != FALSE &&
                    !sidEhPrincipalProibido(sidAce, identidade);
                inspecao.mascaraExata = ace->Mask == mascaraEsperada;
                inspecao.semDireitosCriticos =
                    (ace->Mask & (WRITE_DAC | WRITE_OWNER | DELETE)) == 0 &&
                    ace->Mask != FILE_ALL_ACCESS;
                inspecao.mascaraIncluiCriarInstancia =
                    (ace->Mask & FILE_CREATE_PIPE_INSTANCE) != 0;
            }
        }
    }

    DWORD flagsHandle = 0;
    if (GetHandleInformation(pipe, &flagsHandle) == FALSE) {
        falharWin32("A inspeção das flags de herança do handle");
    }
    inspecao.handleNaoHerdavel = (flagsHandle & HANDLE_FLAG_INHERIT) == 0;
    return inspecao;
}

bool clientePertenceAoMesmoLogon(HANDLE pipe, const SidCopiado& sidLogonEsperado) {
    if (ImpersonateNamedPipeClient(pipe) == FALSE) {
        return false;
    }

    bool corresponde = false;
    try {
        HANDLE tokenBruto = nullptr;
        if (OpenThreadToken(GetCurrentThread(), TOKEN_QUERY, TRUE, &tokenBruto) != FALSE) {
            HandleUnico token(tokenBruto);
            const SidCopiado sidCliente = obterSidLogonDoToken(token.obter());
            corresponde = EqualSid(sidCliente.obter(), sidLogonEsperado.obter()) != FALSE;
        }
    } catch (...) {
        corresponde = false;
    }

    if (RevertToSelf() == FALSE) {
        ExitProcess(3);
    }
    return corresponde;
}

}  // namespace argonauta
