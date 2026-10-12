package com.example.smartsolarmobile.ui.reservation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MyNodeSlotsUiState(
    val isLoading: Boolean = true,
    val myNode: NodeDto? = null,
    val notAssigned: Boolean = false,
    val errorMessage: String? = null
)

class MyNodeSlotsViewModel(
    private val repository: ReservationRepository,
    private val gridOperatorUserId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyNodeSlotsUiState())
    val uiState: StateFlow<MyNodeSlotsUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getAllNodes().fold(
                onSuccess = { nodes ->
                    val myNode = nodes.firstOrNull { it.assignedGridOperatorUserId == gridOperatorUserId }
                    _uiState.update { it.copy(isLoading = false, myNode = myNode, notAssigned = myNode == null) }
                },
                onFailure = { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.toFriendlyMessage()) } }
            )
        }
    }
}

class MyNodeSlotsViewModelFactory(
    private val repository: ReservationRepository,
    private val gridOperatorUserId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MyNodeSlotsViewModel::class.java)) {
            return MyNodeSlotsViewModel(repository, gridOperatorUserId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
