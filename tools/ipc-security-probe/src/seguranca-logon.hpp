#pragma once

#include <windows.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace argonauta {

inline constexpr ACCESS_MASK MASCARA_COMPATIVEL_NODE = FILE_GENERIC_READ | FILE_GENERIC_WRITE;
inline constexpr ACCESS_MASK MASCARA_ESTRITA =
    FILE_READ_DATA |
    FILE_WRITE_DATA |
    FILE_READ_EA |
    FILE_WRITE_EA |
    FILE_READ_ATTRIBUTES |
    FILE_WRITE_ATTRIBUTES |
    SYNCHRONIZE;

class SidCopiado final {
public:
    SidCopiado() = default;
    explicit SidCopiado(std::vector<std::byte> bytes) : bytes_(std::move(bytes)) {}

    [[nodiscard]] PSID obter() noexcept;
    [[nodiscard]] PSID obter() const noexcept;
    [[nodiscard]] bool valido() const noexcept;

private:
    std::vector<std::byte> bytes_;
};

struct IdentidadeProcesso final {
    SidCopiado sidLogon;
    SidCopiado sidUsuario;
    SidCopiado sidProprietario;
    SidCopiado sidGrupoPrimario;
};

class DescritorSegurancaPipe final {
public:
    DescritorSegurancaPipe(const SidCopiado& sidLogon, ACCESS_MASK mascara);

    [[nodiscard]] SECURITY_ATTRIBUTES* atributos() noexcept;
    [[nodiscard]] ACCESS_MASK mascara() const noexcept;

private:
    std::vector<std::byte> acl_;
    SECURITY_DESCRIPTOR descritor_{};
    SECURITY_ATTRIBUTES atributos_{};
    ACCESS_MASK mascara_{};
};

struct ResultadoInspecaoSeguranca final {
    bool daclPresente{false};
    bool daclNaoNula{false};
    bool daclProtegida{false};
    bool daclNaoPadrao{false};
    bool umaAceExplicita{false};
    bool acePermitida{false};
    bool aceNaoHerdada{false};
    bool sidAceEhLogon{false};
    bool semPrincipaisProibidos{false};
    bool mascaraExata{false};
    bool semDireitosCriticos{false};
    bool handleNaoHerdavel{false};
    bool proprietarioEsperado{false};
    bool grupoEsperado{false};
    bool mascaraIncluiCriarInstancia{false};
    DWORD quantidadeAces{0};
    ACCESS_MASK mascaraObservada{0};

    [[nodiscard]] bool estruturaAprovada() const noexcept;
};

[[nodiscard]] IdentidadeProcesso obterIdentidadeDoProcesso();
[[nodiscard]] SidCopiado obterSidLogonDoToken(HANDLE token);
[[nodiscard]] ResultadoInspecaoSeguranca inspecionarSegurancaPipe(
    HANDLE pipe,
    const IdentidadeProcesso& identidade,
    ACCESS_MASK mascaraEsperada);
[[nodiscard]] bool clientePertenceAoMesmoLogon(HANDLE pipe, const SidCopiado& sidLogonEsperado);

}  // namespace argonauta
