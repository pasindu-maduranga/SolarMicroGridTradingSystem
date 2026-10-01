package com.example.smartsolarmobile.ui.reservation

import android.location.Location
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.util.toFriendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Date

data class NodeWithDistance(
    val node: NodeDto,
    val distanceKm: Double?
)

data class ReserveSlotUiState(
    val isLoading: Boolean = true,
    val nodes: List<NodeWithDistance> = emptyList(),
    val userLatitude: Double? = null,
    val userLongitude: Double? = null,
    val isLiveLocation: Boolean = false,
    val searchQuery: String = "",
    val selectedNode: NodeDto? = null,
    val selectedNodeBookings: List<ReservationDto> = emptyList(),
    val pendingSlotNumber: Int? = null,
    val reservingSlotNumber: Int? = null,
    val confirmedReservation: ReservationDto? = null,
    val errorMessage: String? = null
) {
    val filteredNodes: List<NodeWithDistance>
        get() = if (searchQuery.isBlank()) nodes else nodes.filter {
            it.node.name.contains(searchQuery, ignoreCase = true) ||
                it.node.address?.contains(searchQuery, ignoreCase = true) == true
        }
}

class ReserveSlotViewModel(
    private val repository: ReservationRepository,
    private val authRepository: AuthRepository,
    private val prosumerNic: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReserveSlotUiState())
    val uiState: StateFlow<ReserveSlotUiState> = _uiState.asStateFlow()

    // Live device GPS is the source of truth for "how far is this hub from me right now" - the
    // Prosumer's registered home location (set in Edit Profile) is only a fallback for when GPS
    // isn't available yet (permission not granted, no fix acquired, or running on an emulator
    // with no simulated location set).
    private var profileLocation: Location? = null
    private var deviceLocation: Location? = null
    private fun activeLocation(): Location? = deviceLocation ?: profileLocation

    /** Fetches the Prosumer's saved home location so distances reflect where they actually
     *  registered from, not just whatever the device's GPS happens to report right now. */
    fun loadProsumerLocation() {
        viewModelScope.launch {
            authRepository.getProsumerByNic(prosumerNic).fold(
                onSuccess = { prosumer ->
                    val lat = prosumer.latitude
                    val lng = prosumer.longitude
                    val hasRealLocation = (lat != null && lat != 0.0) || (lng != null && lng != 0.0)
                    if (hasRealLocation && lat != null && lng != null) {
                        profileLocation = Location("profile").apply {
                            latitude = lat
                            longitude = lng
                        }
                        updateLocationState()
                        resortByDistance()
                    }
                },
                onFailure = { /* fall back silently to device GPS, if any */ }
            )
        }
    }

    fun onLocationAvailable(location: Location?) {
        deviceLocation = location
        updateLocationState()
        resortByDistance()
    }

    private fun updateLocationState() {
        val loc = activeLocation()
        _uiState.update {
            it.copy(
                userLatitude = loc?.latitude,
                userLongitude = loc?.longitude,
                isLiveLocation = deviceLocation != null
            )
        }
    }

    fun loadNodes() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getAllNodes().fold(
                onSuccess = { nodes ->
                    val active = nodes.filter { it.isActive }
                    _uiState.update { it.copy(isLoading = false, nodes = withDistance(active)) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = e.toFriendlyMessage("Failed to load nodes.")) }
                }
            )
        }
    }

    private fun resortByDistance() {
        _uiState.update { it.copy(nodes = withDistance(it.nodes.map { n -> n.node })) }
    }

    private fun withDistance(nodes: List<NodeDto>): List<NodeWithDistance> {
        val loc = activeLocation()
        val withDist = nodes.map { node ->
            val distance = if (loc != null) {
                val result = FloatArray(1)
                Location.distanceBetween(loc.latitude, loc.longitude, node.latitude, node.longitude, result)
                (result[0] / 1000.0)
            } else null
            NodeWithDistance(node, distance)
        }
        return if (loc != null) withDist.sortedBy { it.distanceKm } else withDist
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectNode(node: NodeDto?) {
        _uiState.update { it.copy(selectedNode = node, selectedNodeBookings = emptyList(), pendingSlotNumber = null) }
        if (node != null) {
            // So the date/time picker can show "already booked" times for transparency -
            // capacity is shared (see ReservationRepository), so this is informational, not a
            // hard block on picking a popular time.
            viewModelScope.launch {
                repository.getReservationsByNode(node.nodeId).onSuccess { bookings ->
                    val relevant = bookings.filter { it.status != "Cancelled" }
                    _uiState.update { it.copy(selectedNodeBookings = relevant) }
                }
            }
        }
    }

    /** Tapping an available slot doesn't reserve immediately - it opens the date/time picker
     *  (a Prosumer must choose a drop-off time within the next 7 days). */
    fun requestSlot(slotNumber: Int) {
        _uiState.update { it.copy(pendingSlotNumber = slotNumber) }
    }

    fun cancelSlotRequest() {
        _uiState.update { it.copy(pendingSlotNumber = null) }
    }

    fun reserveSlot(nodeId: String, slotNumber: Int, scheduledDate: Date) {
        viewModelScope.launch {
            _uiState.update { it.copy(reservingSlotNumber = slotNumber, errorMessage = null) }
            repository.reserveSlot(nodeId, slotNumber, prosumerNic, scheduledDate).fold(
                onSuccess = { reservation ->
                    _uiState.update {
                        it.copy(
                            reservingSlotNumber = null,
                            confirmedReservation = reservation,
                            selectedNode = null,
                            pendingSlotNumber = null
                        )
                    }
                    loadNodes()
                },
                onFailure = { e ->
                    _uiState.update { it.copy(reservingSlotNumber = null, pendingSlotNumber = null, errorMessage = e.toFriendlyMessage("Could not reserve this slot.")) }
                }
            )
        }
    }

    fun dismissConfirmation() {
        _uiState.update { it.copy(confirmedReservation = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
