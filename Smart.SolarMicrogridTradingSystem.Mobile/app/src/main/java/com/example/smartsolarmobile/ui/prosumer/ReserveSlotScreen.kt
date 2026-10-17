package com.example.smartsolarmobile.ui.prosumer


import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.clickable
import androidx.compose.ui.graphics.Color
import com.example.smartsolarmobile.ui.components.PrimaryButton

@Composable
fun ReserveSlotScreen(
    onBack: () -> Unit,
    onConfirm: () -> Unit
) {
    var selectedDateIndex by remember { mutableStateOf(0) }
    var selectedTimeIndex by remember { mutableStateOf(1) }
    val dates = listOf("Today" to "30", "Wed" to "1", "Thu" to "2", "Fri" to "3")
    val times = listOf("09:00", "10:00", "11:00", "13:00", "14:00", "15:00")

    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
//header
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            Text("Reserve a slot", fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        //station card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Riverside Station", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                Text("1.2 km away · 4 slots free", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("Date", fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        //date row

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            dates.forEachIndexed { index, (label, day) ->
                val selected = index == selectedDateIndex
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface)
                        .clickable { selectedDateIndex = index }
                        .padding(vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(label, fontSize = 11.sp, color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(day, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface)
                }
            }
        }
        //time
        Spacer(modifier = Modifier.height(20.dp))
        Text("Available time slots", fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        times.chunked(3).forEachIndexed { rowIndex, rowTimes ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 8.dp)) {
                rowTimes.forEachIndexed { colIndex, time ->
                    val index = rowIndex * 3 + colIndex
                    val selected = index == selectedTimeIndex
                    Text(
                        text = time,
                        fontSize = 13.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(50))
                            .background(if (selected) MaterialTheme.colorScheme.primary else Color.Transparent)
                            .clickable { selectedTimeIndex = index }
                            .padding(vertical = 10.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        }
        Spacer(modifier = Modifier.weight(1f))

        Text(
            "Selected: ${dates[selectedDateIndex].first} ${dates[selectedDateIndex].second}, ${times[selectedTimeIndex]}",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(12.dp))
        PrimaryButton(text = "Confirm reservation", onClick = onConfirm)
    }
}







