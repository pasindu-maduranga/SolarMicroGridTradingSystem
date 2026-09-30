package com.example.smartsolarmobile.ui.reservation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.ReservationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TransactionHistoryUiState(
    val isLoading: Boolean = true,
    val nodeName: String? = null,
    val transactions: List<ReservationDto> = emptyList(),
    val notAssigned: Boolean = false,
    val errorMessage: String? = null
) {
    val totalPaidOut: Double get() = transactions.sumOf { it.amountEarned ?: 0.0 }
    val totalEnergyDeliveredKwh: Double get() = transactions.sumOf { it.energyDeliveredKwh ?: 0.0 }
}

class TransactionHistoryViewModel(
    private val repository: ReservationRepository,
    private val gridOperatorUserId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransactionHistoryUiState())
    val uiState: StateFlow<TransactionHistoryUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getAllNodes().fold(
                onSuccess = { nodes ->
                    val myNode = nodes.firstOrNull { it.assignedGridOperatorUserId == gridOperatorUserId }
                    if (myNode == null) {
                        _uiState.update { it.copy(isLoading = false, notAssigned = true) }
                        return@launch
                    }
                    repository.getReservationsByNode(myNode.nodeId).fold(
                        onSuccess = { list ->
                            val completed = list.filter { it.status == "Completed" }.sortedByDescending { it.completedDate }
                            _uiState.update { it.copy(isLoading = false, nodeName = myNode.name, transactions = completed) }
                        },
                        onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.message) } }
                    )
                },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.message) } }
            )
        }
    }

    fun clearError() = _uiState.update { it.copy(errorMessage = null) }
}

class TransactionHistoryViewModelFactory(
    private val repository: ReservationRepository,
    private val gridOperatorUserId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TransactionHistoryViewModel::class.java)) {
            return TransactionHistoryViewModel(repository, gridOperatorUserId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
