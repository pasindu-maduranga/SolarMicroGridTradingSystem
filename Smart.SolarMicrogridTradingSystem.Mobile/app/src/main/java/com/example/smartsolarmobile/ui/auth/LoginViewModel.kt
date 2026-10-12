package com.example.smartsolarmobile.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val username: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val usernameError: String? = null,
    val passwordError: String? = null,
    val isSuccess: Boolean = false,
    val authenticatedSession: UserSession? = null
)

class LoginViewModel(
    private val repository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onUsernameChanged(value: String) {
        _uiState.update { it.copy(username = value, usernameError = null, errorMessage = null) }
    }

    fun onPasswordChanged(value: String) {
        _uiState.update { it.copy(password = value, passwordError = null, errorMessage = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    /** This ViewModel is kept alive for the whole app (it's Activity-scoped, not tied to the
     *  current screen), so without this, isSuccess/authenticatedSession from a previous login
     *  would still be set the next time the Login screen is shown (e.g. right after signing
     *  out) and immediately bounce the user straight back in. */
    fun consumeSuccess() {
        _uiState.update {
            it.copy(username = "", password = "", isSuccess = false, authenticatedSession = null)
        }
    }

    fun login() {
        val currentState = _uiState.value
        val username = currentState.username.trim()
        val password = currentState.password

        var hasError = false
        var usernameError: String? = null
        var passwordError: String? = null

        if (username.isBlank()) {
            usernameError = "Username or NIC is required"
            hasError = true
        }

        if (password.isBlank()) {
            passwordError = "Password is required"
            hasError = true
        }

        if (hasError) {
            _uiState.update {
                it.copy(
                    usernameError = usernameError,
                    passwordError = passwordError
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val result = repository.login(
                userName = username,
                password = password
            )

            result.fold(
                onSuccess = { session ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isSuccess = true,
                            authenticatedSession = session
                        )
                    }
                },
                onFailure = { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = exception.toFriendlyMessage("Authentication failed. Please check your credentials.")
                        )
                    }
                }
            )
        }
    }
}
