package com.example.smartsolarmobile.ui.reservation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.data.repository.parseIsoUtc
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Date

enum class ReservationTab { PENDING, HISTORY }

data class MyReservationsUiState(
    val isLoading: Boolean = true,
    val reservations: List<ReservationDto> = emptyList(),
    val selectedTab: ReservationTab = ReservationTab.PENDING,
    val searchQuery: String = "",
    val viewingQrFor: ReservationDto? = null,
    val reschedulingReservation: ReservationDto? = null,
    val errorMessage: String? = null
) {
    val filteredReservations: List<ReservationDto>
        get() = reservations
            .filter { if (selectedTab == ReservationTab.PENDING) it.status == "Active" else it.status != "Active" }
            .filter { searchQuery.isBlank() || it.nodeName.contains(searchQuery, ignoreCase = true) }

    /** Active reservations need >= 12 hours' notice to edit/cancel - mirrors the backend rule so
     *  the buttons look disabled instead of just failing after a tap. */
    fun canModify(reservation: ReservationDto): Boolean {
        val scheduled = parseIsoUtc(reservation.scheduledDate) ?: return true
        return scheduled.time - System.currentTimeMillis() >= 12L * 60 * 60 * 1000
    }
}

class MyReservationsViewModel(
    private val repository: ReservationRepository,
    private val prosumerNic: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyReservationsUiState())
    val uiState: StateFlow<MyReservationsUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getMyReservations(prosumerNic).fold(
                onSuccess = { list -> _uiState.update { it.copy(isLoading = false, reservations = list) } },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }

    fun selectTab(tab: ReservationTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun showQr(reservation: ReservationDto) {
        _uiState.update { it.copy(viewingQrFor = reservation) }
    }

    fun dismissQr() {
        _uiState.update { it.copy(viewingQrFor = null) }
    }

    fun startReschedule(reservation: ReservationDto) {
        _uiState.update { it.copy(reschedulingReservation = reservation) }
    }

    fun cancelReschedule() {
        _uiState.update { it.copy(reschedulingReservation = null) }
    }

    fun confirmReschedule(newDate: Date) {
        val reservation = _uiState.value.reschedulingReservation ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(reschedulingReservation = null) }
            repository.updateReservation(reservation.reservationId, prosumerNic, null, newDate).fold(
                onSuccess = { load() },
                onFailure = { e -> _uiState.update { it.copy(errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }

    fun cancel(reservation: ReservationDto) {
        viewModelScope.launch {
            repository.cancelReservation(reservation.reservationId, prosumerNic).fold(
                onSuccess = { load() },
                onFailure = { e -> _uiState.update { it.copy(errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
