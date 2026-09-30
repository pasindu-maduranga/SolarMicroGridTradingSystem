package com.example.smartsolarmobile.ui.reservation

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerifyReservationScreen(
    viewModel: VerifyReservationViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    val scanLauncher = rememberLauncherForActivityResult(ScanContract()) { result ->
        result.contents?.let { qrToken -> viewModel.onScanned(qrToken) }
    }

    fun launchScan() {
        val options = ScanOptions()
            .setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            .setPrompt("Scan the Prosumer's reservation QR code")
            .setBeepEnabled(true)
            .setOrientationLocked(true)
        scanLauncher.launch(options)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Verify Reservation") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back") }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when {
                uiState.isLoading -> CircularProgressIndicator()

                uiState.verifiedReservation != null -> {
                    val reservation = uiState.verifiedReservation!!
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.height(72.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Reservation Verified", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Spacer(Modifier.height(6.dp))
                        Text("${reservation.nodeName} · Slot #${reservation.slotNumber}", fontSize = 14.sp)
                        Text("Prosumer: ${reservation.prosumerName} (${reservation.prosumerNic})", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(12.dp))
                        Row(
                            modifier = Modifier
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
                                .padding(horizontal = 16.dp, vertical = 10.dp)
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${reservation.energyDeliveredKwh ?: 0.0} kWh delivered", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    "Rs. ${reservation.amountEarned ?: 0.0} paid to Prosumer",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        Spacer(Modifier.height(20.dp))
                        Row(horizontalArrangement = Arrangement.Center) {
                            Button(onClick = { viewModel.reset() }) { Text("Scan Another") }
                        }
                    }
                }

                uiState.errorMessage != null -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                        Icon(Icons.Default.Error, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.height(72.dp))
                        Spacer(Modifier.height(12.dp))
                        Text(uiState.errorMessage ?: "Verification failed", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(Modifier.height(20.dp))
                        Button(onClick = { viewModel.reset() }) { Text("Try Again") }
                    }
                }

                else -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                        Icon(
                            Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.height(72.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text("Scan a Prosumer's QR code to check them in at this hub.", fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Spacer(Modifier.height(20.dp))
                        Button(onClick = { launchScan() }, shape = CircleShape) { Text("Start Scanning") }
                    }
                }
            }
        }
    }

    uiState.scannedQrToken?.let {
        MeterReadingDialog(
            isSubmitting = uiState.isLoading,
            onDismiss = { viewModel.cancelEnergyEntry() },
            onConfirm = { kwh -> viewModel.confirmEnergyDelivered(kwh) }
        )
    }
}

@Composable
private fun MeterReadingDialog(
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var reading by remember { mutableStateOf("") }
    val parsed = reading.toDoubleOrNull()

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        title = { Text("Enter meter reading") },
        text = {
            Column {
                Text(
                    "Read the actual energy delivered this session off the hub's meter (kWh) - this is what the Prosumer is paid for.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = reading,
                    onValueChange = { reading = it },
                    label = { Text("Energy delivered (kWh)") },
                    singleLine = true,
                    enabled = !isSubmitting,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { parsed?.let(onConfirm) },
                enabled = !isSubmitting && parsed != null && parsed > 0
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.height(18.dp), strokeWidth = 2.dp)
                } else {
                    Text("Confirm & Pay")
                }
            }
        },
        dismissButton = {
            Button(onClick = onDismiss, enabled = !isSubmitting) { Text("Cancel") }
        }
    )
}
