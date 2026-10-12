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

data class EarningsUiState(
    val isLoading: Boolean = true,
    val completedReservations: List<ReservationDto> = emptyList(),
    val errorMessage: String? = null
) {
    val totalEarned: Double get() = completedReservations.sumOf { it.amountEarned ?: 0.0 }
    val totalEnergyDeliveredKwh: Double get() = completedReservations.sumOf { it.energyDeliveredKwh ?: 0.0 }
}

class EarningsViewModel(
    private val repository: ReservationRepository,
    private val prosumerNic: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(EarningsUiState())
    val uiState: StateFlow<EarningsUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getMyReservations(prosumerNic).fold(
                onSuccess = { list ->
                    val completed = list.filter { it.status == "Completed" }
                        .sortedByDescending { it.completedDate }
                    _uiState.update { it.copy(isLoading = false, completedReservations = completed) }
                },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }
}
