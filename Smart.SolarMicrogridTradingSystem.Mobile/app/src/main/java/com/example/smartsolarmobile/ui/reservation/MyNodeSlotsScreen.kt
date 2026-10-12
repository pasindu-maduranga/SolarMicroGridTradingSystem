package com.example.smartsolarmobile.ui.reservation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.ui.components.BatterySlot

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyNodeSlotsScreen(
    viewModel: MyNodeSlotsViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Node Slots") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back") }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding).background(MaterialTheme.colorScheme.background)) {
            when {
                uiState.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                uiState.notAssigned -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("You are not currently assigned to a node.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                uiState.myNode != null -> {
                    val node = uiState.myNode!!
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Text(node.name, fontWeight = FontWeight.Bold, fontSize = 19.sp)

                        Spacer(Modifier.height(10.dp))

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceEvenly
                            ) {
                                StatColumn(value = "${node.availableSlotsCount}/${node.numberOfSlots}", label = "Slots free")
                                StatColumn(value = "${node.availableCapacity.toInt()}/${node.capacity.toInt()} kW", label = "Capacity free")
                            }
                        }

                        Spacer(Modifier.height(18.dp))

                        LazyVerticalGrid(
                            columns = GridCells.Fixed(3),
                            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(10.dp),
                            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(node.slots, key = { it.slotNumber }) { slot ->
                                BatterySlot(
                                    slotNumber = slot.slotNumber,
                                    capacityKw = slot.capacity,
                                    isAvailable = slot.isAvailable,
                                    remainingCapacityKw = slot.remainingCapacity
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatColumn(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
