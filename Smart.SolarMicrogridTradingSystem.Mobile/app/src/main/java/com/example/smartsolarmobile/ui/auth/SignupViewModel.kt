package com.example.smartsolarmobile.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.ProsumerDto
import com.example.smartsolarmobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SignupUiState(
    val nic: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val address: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val isSuccess: Boolean = false,
    val createdProsumer: ProsumerDto? = null,
    // Field errors
    val nicError: String? = null,
    val firstNameError: String? = null,
    val lastNameError: String? = null,
    val emailError: String? = null,
    val phoneError: String? = null,
    val addressError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null
)

class SignupViewModel(
    private val repository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignupUiState())
    val uiState: StateFlow<SignupUiState> = _uiState.asStateFlow()

    fun onNicChanged(v: String) = _uiState.update { it.copy(nic = v, nicError = null, errorMessage = null) }
    fun onFirstNameChanged(v: String) = _uiState.update { it.copy(firstName = v, firstNameError = null, errorMessage = null) }
    fun onLastNameChanged(v: String) = _uiState.update { it.copy(lastName = v, lastNameError = null, errorMessage = null) }
    fun onEmailChanged(v: String) = _uiState.update { it.copy(email = v, emailError = null, errorMessage = null) }
    fun onPhoneChanged(v: String) = _uiState.update { it.copy(phoneNumber = v, phoneError = null, errorMessage = null) }
    fun onAddressChanged(v: String) = _uiState.update { it.copy(address = v, addressError = null, errorMessage = null) }
    fun onPasswordChanged(v: String) = _uiState.update { it.copy(password = v, passwordError = null, errorMessage = null) }
    fun onConfirmPasswordChanged(v: String) = _uiState.update { it.copy(confirmPassword = v, confirmPasswordError = null, errorMessage = null) }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    fun registerProsumer() {
        val s = _uiState.value

        var hasError = false
        var nicErr: String? = null
        var fnErr: String? = null
        var lnErr: String? = null
        var emailErr: String? = null
        var phoneErr: String? = null
        var addrErr: String? = null
        var passErr: String? = null
        var confirmErr: String? = null

        if (s.nic.isBlank()) {
            nicErr = "NIC number is required"
            hasError = true
        }

        if (s.firstName.isBlank()) {
            fnErr = "First name is required"
            hasError = true
        }

        if (s.lastName.isBlank()) {
            lnErr = "Last name is required"
            hasError = true
        }

        if (s.email.isBlank() || !android.util.Patterns.EMAIL_ADDRESS.matcher(s.email).matches()) {
            emailErr = "Valid email address is required"
            hasError = true
        }

        if (s.phoneNumber.isBlank()) {
            phoneErr = "Phone number is required"
            hasError = true
        }

        if (s.address.isBlank()) {
            addrErr = "Address is required"
            hasError = true
        }

        if (s.password.length < 6) {
            passErr = "Password must be at least 6 characters"
            hasError = true
        }

        if (s.confirmPassword != s.password) {
            confirmErr = "Passwords do not match"
            hasError = true
        }

        if (hasError) {
            _uiState.update {
                it.copy(
                    nicError = nicErr,
                    firstNameError = fnErr,
                    lastNameError = lnErr,
                    emailError = emailErr,
                    phoneError = phoneErr,
                    addressError = addrErr,
                    passwordError = passErr,
                    confirmPasswordError = confirmErr
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val result = repository.registerProsumer(
                nic = s.nic,
                firstName = s.firstName,
                lastName = s.lastName,
                email = s.email,
                password = s.password,
                phoneNumber = s.phoneNumber,
                address = s.address
            )

            result.fold(
                onSuccess = { prosumer ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isSuccess = true,
                            createdProsumer = prosumer,
                            successMessage = "Registration successful! You can now log in with your NIC/Email."
                        )
                    }
                },
                onFailure = { ex ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = ex.message ?: "Failed to create Prosumer account."
                        )
                    }
                }
            )
        }
    }
}
