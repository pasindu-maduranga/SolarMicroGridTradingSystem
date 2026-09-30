package com.example.smartsolarmobile.ui.reservation

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.R
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.parseIsoUtc
import com.example.smartsolarmobile.data.repository.toFriendlyString
import com.example.smartsolarmobile.ui.components.QrCodeImage
import com.example.smartsolarmobile.ui.components.rememberDateTimePickerLauncher

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyReservationsScreen(
    viewModel: MyReservationsViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    val launchReschedulePicker = rememberDateTimePickerLauncher(
        onCancelled = { viewModel.cancelReschedule() },
        onPicked = { viewModel.confirmReschedule(it) }
    )

    LaunchedEffect(Unit) { viewModel.load() }

    LaunchedEffect(uiState.reschedulingReservation) {
        if (uiState.reschedulingReservation != null) {
            launchReschedulePicker()
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
                title = { Text("My Reservations") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back") }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = if (uiState.selectedTab == ReservationTab.PENDING) 0 else 1) {
                Tab(
                    selected = uiState.selectedTab == ReservationTab.PENDING,
                    onClick = { viewModel.selectTab(ReservationTab.PENDING) },
                    text = { Text("Pending") }
                )
                Tab(
                    selected = uiState.selectedTab == ReservationTab.HISTORY,
                    onClick = { viewModel.selectTab(ReservationTab.HISTORY) },
                    text = { Text("History") }
                )
            }

            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = { Text("Search by hub name", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            )

            Box(modifier = Modifier.fillMaxSize()) {
                if (uiState.isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                } else if (uiState.filteredReservations.isEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.illustration_booking),
                            contentDescription = null,
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxWidth().height(220.dp)
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(
                            if (uiState.selectedTab == ReservationTab.PENDING) "No pending reservations" else "No history yet",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            "Reserve a slot at a nearby node to see it here.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        items(uiState.filteredReservations, key = { it.reservationId }) { reservation ->
                            ReservationCard(
                                reservation = reservation,
                                canModify = uiState.canModify(reservation),
                                onShowQr = { viewModel.showQr(reservation) },
                                onReschedule = { viewModel.startReschedule(reservation) },
                                onCancel = { viewModel.cancel(reservation) }
                            )
                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }
            }
        }
    }

    uiState.viewingQrFor?.let { reservation ->
        AlertDialog(
            onDismissRequest = { viewModel.dismissQr() },
            title = { Text("${reservation.nodeName} — Slot #${reservation.slotNumber}") },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    QrCodeImage(content = reservation.qrToken)
                    Spacer(Modifier.height(10.dp))
                    Text("Show this to a Grid Operator at the hub.", fontSize = 12.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            confirmButton = { Button(onClick = { viewModel.dismissQr() }) { Text("Close") } }
        )
    }
}

@Composable
private fun ReservationCard(
    reservation: ReservationDto,
    canModify: Boolean,
    onShowQr: () -> Unit,
    onReschedule: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(reservation.nodeName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                StatusChip(reservation.status)
            }
            Text("Slot #${reservation.slotNumber} · ${reservation.slotCapacity.toInt()} kW · Rs. ${reservation.unitPricePerKwh}/kWh", fontSize = 12.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            parseIsoUtc(reservation.scheduledDate)?.let {
                Text("Scheduled: ${it.toFriendlyString()}", fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (reservation.status == "Completed") {
                Text(
                    "${reservation.energyDeliveredKwh ?: 0.0} kWh delivered · Rs. ${reservation.amountEarned ?: 0.0} earned",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (reservation.status == "Active") {
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = onShowQr) { Text("Show QR") }
                    OutlinedButton(onClick = onReschedule, enabled = canModify) { Text("Reschedule") }
                    OutlinedButton(onClick = onCancel, enabled = canModify) { Text("Cancel") }
                }
                if (!canModify) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Less than 12 hours to go - can no longer be changed.",
                        fontSize = 10.5.sp,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val color = when (status) {
        "Completed" -> MaterialTheme.colorScheme.primary
        "Cancelled" -> MaterialTheme.colorScheme.onSurfaceVariant
        else -> MaterialTheme.colorScheme.tertiary
    }
    Text(
        text = status,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = color
    )
}
