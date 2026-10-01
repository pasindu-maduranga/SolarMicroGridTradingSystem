package com.example.smartsolarmobile.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EditProfileUiState(
    val isLoading: Boolean = true,
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val address: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val showLocationPicker: Boolean = false,
    val isSaving: Boolean = false,
    val saved: Boolean = false,
    val deactivated: Boolean = false,
    val showDeactivateConfirm: Boolean = false,
    val errorMessage: String? = null
)

class EditProfileViewModel(
    private val repository: AuthRepository,
    private val nic: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(EditProfileUiState())
    val uiState: StateFlow<EditProfileUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getProsumerByNic(nic).fold(
                onSuccess = { prosumer ->
                    // Prosumers seeded/created before GPS capture was required were stored with
                    // Latitude/Longitude defaulting to 0.0 (not truly null in the DB) - (0, 0) is
                    // open ocean off West Africa, so nobody's real location, treat it as unset.
                    val hasRealLocation = (prosumer.latitude != null && prosumer.latitude != 0.0) ||
                        (prosumer.longitude != null && prosumer.longitude != 0.0)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            firstName = prosumer.firstName,
                            lastName = prosumer.lastName,
                            email = prosumer.email,
                            phoneNumber = prosumer.phoneNumber,
                            address = prosumer.address,
                            latitude = if (hasRealLocation) prosumer.latitude else null,
                            longitude = if (hasRealLocation) prosumer.longitude else null
                        )
                    }
                },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }

    fun onFirstNameChanged(v: String) = _uiState.update { it.copy(firstName = v) }
    fun onLastNameChanged(v: String) = _uiState.update { it.copy(lastName = v) }
    fun onEmailChanged(v: String) = _uiState.update { it.copy(email = v) }
    fun onPhoneChanged(v: String) = _uiState.update { it.copy(phoneNumber = v) }
    fun onAddressChanged(v: String) = _uiState.update { it.copy(address = v) }

    fun showLocationPicker() = _uiState.update { it.copy(showLocationPicker = true) }
    fun dismissLocationPicker() = _uiState.update { it.copy(showLocationPicker = false) }

    fun onLocationPicked(lat: Double, lng: Double) {
        _uiState.update { it.copy(latitude = lat, longitude = lng, showLocationPicker = false) }
    }

    fun save() {
        val s = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, errorMessage = null) }
            repository.updateProsumerProfile(
                nic, s.firstName, s.lastName, s.email, s.phoneNumber, s.address,
                isActive = true, latitude = s.latitude, longitude = s.longitude
            ).fold(
                onSuccess = { _uiState.update { it.copy(isSaving = false, saved = true) } },
                onFailure = { e -> _uiState.update { it.copy(isSaving = false, errorMessage = e.toFriendlyMessage("Could not save your profile.")) } }
            )
        }
    }

    fun requestDeactivateConfirm() = _uiState.update { it.copy(showDeactivateConfirm = true) }
    fun dismissDeactivateConfirm() = _uiState.update { it.copy(showDeactivateConfirm = false) }

    /** Deactivated accounts can only be reactivated by a Backoffice officer - enforced server-side. */
    fun confirmDeactivate() {
        val s = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, showDeactivateConfirm = false, errorMessage = null) }
            repository.updateProsumerProfile(
                nic, s.firstName, s.lastName, s.email, s.phoneNumber, s.address,
                isActive = false, latitude = s.latitude, longitude = s.longitude
            ).fold(
                onSuccess = {
                    repository.logout()
                    _uiState.update { it.copy(isSaving = false, deactivated = true) }
                },
                onFailure = { e -> _uiState.update { it.copy(isSaving = false, errorMessage = e.toFriendlyMessage("Could not deactivate your account.")) } }
            )
        }
    }

    fun clearError() = _uiState.update { it.copy(errorMessage = null) }
}

class EditProfileViewModelFactory(
    private val repository: AuthRepository,
    private val nic: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(EditProfileViewModel::class.java)) {
            return EditProfileViewModel(repository, nic) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
