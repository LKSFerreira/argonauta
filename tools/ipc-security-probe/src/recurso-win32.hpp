#pragma once

#include <windows.h>

#include <utility>

namespace argonauta {

class HandleUnico final {
public:
    HandleUnico() noexcept = default;
    explicit HandleUnico(HANDLE handle) noexcept : handle_(handle) {}

    ~HandleUnico() {
        redefinir();
    }

    HandleUnico(const HandleUnico&) = delete;
    HandleUnico& operator=(const HandleUnico&) = delete;

    HandleUnico(HandleUnico&& outro) noexcept : handle_(outro.liberar()) {}

    HandleUnico& operator=(HandleUnico&& outro) noexcept {
        if (this != &outro) {
            redefinir(outro.liberar());
        }
        return *this;
    }

    [[nodiscard]] HANDLE obter() const noexcept {
        return handle_;
    }

    [[nodiscard]] bool valido() const noexcept {
        return handle_ != nullptr && handle_ != INVALID_HANDLE_VALUE;
    }

    HANDLE liberar() noexcept {
        const HANDLE atual = handle_;
        handle_ = INVALID_HANDLE_VALUE;
        return atual;
    }

    void redefinir(HANDLE novoHandle = INVALID_HANDLE_VALUE) noexcept {
        if (valido()) {
            CloseHandle(handle_);
        }
        handle_ = novoHandle;
    }

private:
    HANDLE handle_{INVALID_HANDLE_VALUE};
};

class MemoriaLocal final {
public:
    explicit MemoriaLocal(HLOCAL memoria = nullptr) noexcept : memoria_(memoria) {}

    ~MemoriaLocal() {
        if (memoria_ != nullptr) {
            LocalFree(memoria_);
        }
    }

    MemoriaLocal(const MemoriaLocal&) = delete;
    MemoriaLocal& operator=(const MemoriaLocal&) = delete;

    [[nodiscard]] HLOCAL obter() const noexcept {
        return memoria_;
    }

private:
    HLOCAL memoria_;
};

}  // namespace argonauta
