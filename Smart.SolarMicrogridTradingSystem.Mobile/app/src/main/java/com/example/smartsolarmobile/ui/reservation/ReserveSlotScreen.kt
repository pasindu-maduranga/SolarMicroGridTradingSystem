package com.example.smartsolarmobile.ui.reservation

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.R
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.repository.parseIsoUtc
import com.example.smartsolarmobile.data.repository.toFriendlyString
import com.example.smartsolarmobile.ui.components.AppSnackbarHost
import com.example.smartsolarmobile.ui.components.QrCodeImage
import com.example.smartsolarmobile.ui.components.vectorToBitmapDescriptor
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.Polyline
import com.google.maps.android.compose.rememberCameraPositionState
import com.google.maps.android.compose.rememberMarkerState

private val SRI_LANKA_CENTER = LatLng(7.8731, 80.7718)

/** Opens turn-by-turn directions in the Google Maps app, explicitly from the Prosumer's current
 *  location to the hub - falls back to whatever app can handle a maps URL if Google Maps itself
 *  isn't installed. */
private fun openDirections(context: Context, from: LatLng, to: LatLng) {
    val uri = Uri.parse(
        "https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}" +
            "&destination=${to.latitude},${to.longitude}&travelmode=driving"
    )
    val mapsIntent = Intent(Intent.ACTION_VIEW, uri).apply { setPackage("com.google.android.apps.maps") }
    try {
        context.startActivity(mapsIntent)
    } catch (e: ActivityNotFoundException) {
        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
    }
}

@OptIn(ExperimentalPermissionsApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ReserveSlotScreen(
    viewModel: ReserveSlotViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)

    LaunchedEffect(Unit) {
        viewModel.loadNodes()
        viewModel.loadProsumerLocation()
        // Proactively prompt for location access as soon as this screen opens, rather than only
        // showing a passive "Enable location" card - a Prosumer reserving a slot should be asked
        // up front, not left to notice and tap a banner themselves.
        if (!locationPermission.status.isGranted) {
            locationPermission.launchPermissionRequest()
        }
    }

    // getLastKnownLocation() alone can return a stale OS-cached fix (sometimes minutes or hours
    // old, or null if no app has used that provider recently) - shown immediately for a fast
    // first paint. Updates then keep coming for as long as this screen is open (like a live
    // ride-hailing map), not just a single fresh fix, so the pin and distance track the Prosumer
    // as they actually move; onDispose stops updates when they leave the screen.
    DisposableEffect(locationPermission.status) {
        if (!locationPermission.status.isGranted) return@DisposableEffect onDispose {}

        val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        val listener = object : android.location.LocationListener {
            override fun onLocationChanged(location: android.location.Location) {
                viewModel.onLocationAvailable(location)
            }
        }

        try {
            providers.firstNotNullOfOrNull { provider ->
                if (locationManager.isProviderEnabled(provider)) locationManager.getLastKnownLocation(provider) else null
            }?.let { viewModel.onLocationAvailable(it) }

            providers.forEach { provider ->
                if (locationManager.isProviderEnabled(provider)) {
                    locationManager.requestLocationUpdates(provider, 3000L, 5f, listener)
                }
            }
        } catch (e: SecurityException) {
            // Permission revoked between the check above and this call - nothing to request.
        }

        onDispose {
            try { locationManager.removeUpdates(listener) } catch (e: SecurityException) { }
        }
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Reserve a Slot") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = { AppSnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (!locationPermission.status.isGranted) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Allow location access to see nodes sorted by distance from you.", fontSize = 13.sp)
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = { locationPermission.launchPermissionRequest() }) {
                            Text("Enable location")
                        }
                    }
                }
            }

            // A separate composable (not inlined here) so typing in the search box below - which
            // only changes uiState.searchQuery - can't force the map, its markers and polylines to
            // recompose. Without this split, every keystroke was rebuilding the whole map overlay
            // set, which is exactly the kind of avoidable lag Compose is prone to when a big screen
            // is written as one giant function reading one big state object.
            ReserveMapSection(
                nodes = uiState.nodes,
                nearestNode = uiState.filteredNodes.firstOrNull(),
                userLatitude = uiState.userLatitude,
                userLongitude = uiState.userLongitude,
                isLiveLocation = uiState.isLiveLocation,
                isLoading = uiState.isLoading,
                onSelectNode = { viewModel.selectNode(it) }
            )

            Text(
                text = "Nearby Nodes",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
            )

            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = { Text("Search by hub name or location", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
            )

            Spacer(Modifier.height(8.dp))

            LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                items(uiState.filteredNodes, key = { it.node.nodeId }) { entry ->
                    NodeCard(entry = entry, onClick = { viewModel.selectNode(entry.node) })
                    Spacer(Modifier.height(10.dp))
                }
            }
        }
    }

    uiState.selectedNode?.let { node ->
        SlotPickerDialog(
            node = node,
            reservingSlotNumber = uiState.reservingSlotNumber,
            onDismiss = { viewModel.selectNode(null) },
            onReserve = { slotNumber -> viewModel.requestSlot(slotNumber) }
        )
    }

    val pendingSlotNumber = uiState.pendingSlotNumber
    val pendingNode = uiState.selectedNode
    if (pendingSlotNumber != null && pendingNode != null) {
        ReservationCalendarDialog(
            slotNumber = pendingSlotNumber,
            openingTime = pendingNode.openingTime,
            closingTime = pendingNode.closingTime,
            existingBookings = uiState.selectedNodeBookings,
            onDismiss = { viewModel.cancelSlotRequest() },
            onConfirm = { pickedDate -> viewModel.reserveSlot(pendingNode.nodeId, pendingSlotNumber, pickedDate) }
        )
    }

    uiState.confirmedReservation?.let { reservation ->
        AlertDialog(
            onDismissRequest = { viewModel.dismissConfirmation() },
            title = { Text("Reservation confirmed!") },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${reservation.nodeName} — Slot #${reservation.slotNumber}", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    parseIsoUtc(reservation.scheduledDate)?.let {
                        Text(it.toFriendlyString(), fontSize = 12.5.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                    }
                    Text("Rs. ${reservation.unitPricePerKwh}/kWh — you're paid for what you actually deliver.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("Show this QR code at the hub to start charging.", fontSize = 12.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(16.dp))
                    QrCodeImage(content = reservation.qrToken)
                }
            },
            confirmButton = {
                Button(onClick = { viewModel.dismissConfirmation() }) { Text("Done") }
            }
        )
    }
}

/** Isolated in its own composable so it only recomposes when the map-relevant state actually
 *  changes (node list, user location, loading) - not on every keystroke elsewhere on the screen. */
@Composable
private fun ReserveMapSection(
    nodes: List<NodeWithDistance>,
    nearestNode: NodeWithDistance?,
    userLatitude: Double?,
    userLongitude: Double?,
    isLiveLocation: Boolean,
    isLoading: Boolean,
    onSelectNode: (NodeDto) -> Unit
) {
    val context = LocalContext.current
    val hubIcon = remember { vectorToBitmapDescriptor(context, R.drawable.ic_hub_marker) }

    Box(modifier = Modifier.fillMaxWidth().height(280.dp)) {
        val cameraPositionState = rememberCameraPositionState {
            position = CameraPosition.fromLatLngZoom(SRI_LANKA_CENTER, 8f)
        }
        val userLatLng = if (userLatitude != null && userLongitude != null) LatLng(userLatitude, userLongitude) else null

        // Once we know where the Prosumer is, frame the camera so their own position and every
        // hub are visible together - makes the real distance between them obvious at a glance
        // instead of only readable by tapping a marker.
        LaunchedEffect(userLatLng, nodes.map { it.node.nodeId }) {
            if (userLatLng != null && nodes.isNotEmpty()) {
                val bounds = LatLngBounds.Builder().apply {
                    include(userLatLng)
                    nodes.forEach { include(LatLng(it.node.latitude, it.node.longitude)) }
                }.build()
                cameraPositionState.animate(CameraUpdateFactory.newLatLngBounds(bounds, 120))
            }
        }

        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState
        ) {
            if (userLatLng != null) {
                Marker(
                    // Keyed on the coordinate itself so a brand-new MarkerState is created whenever
                    // the Prosumer's saved location actually changes - rememberMarkerState's default
                    // (unkeyed) form only captures the position the very first time it's composed,
                    // which is why a location update wasn't reliably moving the pin.
                    state = rememberMarkerState(key = "user_${userLatLng.latitude}_${userLatLng.longitude}", position = userLatLng),
                    title = "Your location",
                    snippet = if (isLiveLocation) "Live location" else "Your registered location (enable location access for live tracking)",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN),
                    zIndex = 2f
                )
            }

            nodes.forEach { entry ->
                val nodeLatLng = LatLng(entry.node.latitude, entry.node.longitude)

                if (userLatLng != null) {
                    Polyline(
                        points = listOf(userLatLng, nodeLatLng),
                        color = MaterialTheme.colorScheme.primary,
                        width = 4f,
                        zIndex = 0f,
                        pattern = listOf(com.google.android.gms.maps.model.Dash(20f), com.google.android.gms.maps.model.Gap(12f))
                    )
                }

                Marker(
                    state = rememberMarkerState(key = "node_${entry.node.nodeId}", position = nodeLatLng),
                    title = entry.node.name,
                    snippet = entry.distanceKm?.let { "%.1f km away • ${entry.node.availableSlotsCount} slot(s) available".format(it) }
                        ?: "${entry.node.availableSlotsCount} slot(s) available",
                    icon = hubIcon,
                    zIndex = 1f,
                    onClick = {
                        onSelectNode(entry.node)
                        true
                    }
                )
            }
        }

        // Always-visible distance readout for the nearest hub, so the real distance is clear
        // without needing to tap a marker.
        nearestNode?.distanceKm?.let { nearestKm ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 8.dp)
                    .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(20.dp))
                    .padding(horizontal = 6.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "Nearest: ${nearestNode.node.name} • %.1f km away".format(nearestKm),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.padding(start = 8.dp)
                )
                if (userLatLng != null) {
                    IconButton(
                        onClick = { openDirections(context, userLatLng, LatLng(nearestNode.node.latitude, nearestNode.node.longitude)) },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = "Get directions",
                            tint = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
    }
}

@Composable
private fun NodeCard(entry: NodeWithDistance, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(entry.node.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(4.dp))
                    Text(
                        entry.distanceKm?.let { "%.1f km away".format(it) } ?: (entry.node.address ?: ""),
                        fontSize = 12.5.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    "${entry.node.availableSlotsCount}/${entry.node.numberOfSlots} slots available",
                    fontSize = 12.5.sp,
                    color = MaterialTheme.colorScheme.primary
                )
                entry.node.slots.minOfOrNull { it.unitPricePerKwh }?.let { price ->
                    Text("From Rs. $price/kWh", fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Button(onClick = onClick, enabled = entry.node.availableSlotsCount > 0) {
                Text("Reserve")
            }
        }
    }
}

@Composable
private fun SlotPickerDialog(
    node: NodeDto,
    reservingSlotNumber: Int?,
    onDismiss: () -> Unit,
    onReserve: (Int) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(node.name) },
        text = {
            Column {
                // A slot's capacity is shared across every Prosumer booking it for the same
                // date, not claimed exclusively by one booking - so every slot is tappable here
                // regardless of today's remaining-capacity snapshot. The date you pick next
                // determines what's actually still free; the server has the final say.
                Text(
                    "Pick any slot, then choose your date - capacity is shared, so a slot " +
                        "showing little left today may still be free on another date.",
                    fontSize = 12.5.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(12.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier.height(220.dp)
                ) {
                    items(node.slots, key = { it.slotNumber }) { slot ->
                        val isBusy = reservingSlotNumber == slot.slotNumber
                        val isTappable = reservingSlotNumber == null
                        val isFullToday = slot.remainingCapacity <= 0

                        Box(
                            modifier = Modifier
                                .padding(4.dp)
                                .size(68.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    when {
                                        isBusy -> MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                                        isFullToday -> MaterialTheme.colorScheme.surfaceVariant
                                        else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                                    }
                                )
                                .clickable(enabled = isTappable) { onReserve(slot.slotNumber) },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isBusy) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("#${slot.slotNumber}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(
                                        if (isFullToday) "Full today" else "${slot.remainingCapacity.toInt()}/${slot.capacity.toInt()}kW",
                                        fontSize = 9.5.sp,
                                        color = if (isFullToday) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text("Rs.${slot.unitPricePerKwh}/kWh", fontSize = 8.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "Close") }
        }
    )
}
