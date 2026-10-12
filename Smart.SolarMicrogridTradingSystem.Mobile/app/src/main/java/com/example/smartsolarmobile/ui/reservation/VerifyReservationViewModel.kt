package com.example.smartsolarmobile.ui.reservation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class VerifyReservationUiState(
    val isLoading: Boolean = false,
    /** Set right after a successful scan - the operator must enter a meter reading before this
     *  reservation is actually completed. */
    val scannedQrToken: String? = null,
    val verifiedReservation: ReservationDto? = null,
    val errorMessage: String? = null
)

class VerifyReservationViewModel(
    private val repository: ReservationRepository,
    private val verifiedBy: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(VerifyReservationUiState())
    val uiState: StateFlow<VerifyReservationUiState> = _uiState.asStateFlow()

    fun onScanned(qrToken: String) {
        _uiState.update { it.copy(scannedQrToken = qrToken, errorMessage = null) }
    }

    /** Called once the Operator has typed in the actual meter reading (kWh) for this session -
     *  this, not the slot's rated capacity, is what the Prosumer gets paid for. */
    fun confirmEnergyDelivered(energyDeliveredKwh: Double) {
        val qrToken = _uiState.value.scannedQrToken ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.verifyReservation(qrToken, verifiedBy, energyDeliveredKwh).fold(
                onSuccess = { reservation -> _uiState.update { it.copy(isLoading = false, scannedQrToken = null, verifiedReservation = reservation) } },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, scannedQrToken = null, errorMessage = e.toFriendlyMessage("Invalid QR code.")) } }
            )
        }
    }

    fun cancelEnergyEntry() {
        _uiState.update { it.copy(scannedQrToken = null) }
    }

    fun reset() {
        _uiState.update { VerifyReservationUiState() }
    }
}
