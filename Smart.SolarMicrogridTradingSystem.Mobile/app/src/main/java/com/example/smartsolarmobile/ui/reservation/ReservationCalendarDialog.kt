package com.example.smartsolarmobile.ui.reservation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.repository.parseIsoUtc
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/** Reservation date/time picker as a 7-day strip (matches the "within 7 days" booking rule - a
 *  full month grid would mostly show dates you can't pick) plus an hourly time grid for the
 *  selected day, clearly marking which hours already have a booking for this slot. Booked hours
 *  stay tappable - a slot's capacity is shared across Prosumers (see ReservationRepository), so
 *  this is transparency, not a hard lock. */
@Composable
fun ReservationCalendarDialog(
    slotNumber: Int,
    openingTime: String?,
    closingTime: String?,
    existingBookings: List<ReservationDto>,
    onDismiss: () -> Unit,
    onConfirm: (Date) -> Unit
) {
    val days = remember {
        (0..6).map { offset -> (Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, offset) }) }
    }
    var selectedDayIndex by remember { mutableIntStateOf(0) }
    var selectedHour by remember { mutableStateOf<Int?>(null) }

    val openHour = remember(openingTime) { openingTime?.substringBefore(":")?.toIntOrNull() ?: 6 }
    val closeHour = remember(closingTime) { closingTime?.substringBefore(":")?.toIntOrNull()?.coerceAtLeast(openHour + 1) ?: 22 }

    val selectedCalendar = days[selectedDayIndex]
    val now = remember { Calendar.getInstance() }
    val isToday = selectedDayIndex == 0

    // Hours already booked for THIS slot on the selected day - any status except Cancelled, so a
    // Prosumer can see what's already claimed (even if not yet verified) before picking a time.
    val bookedHours = remember(selectedDayIndex, existingBookings) {
        existingBookings
            .filter { it.slotNumber == slotNumber }
            .mapNotNull { parseIsoUtc(it.scheduledDate) }
            .filter { isSameDay(it, selectedCalendar.time) }
            .map { d -> Calendar.getInstance().apply { time = d }.get(Calendar.HOUR_OF_DAY) }
            .toSet()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Slot #$slotNumber — pick date & time") },
        text = {
            Column {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    days.forEachIndexed { index, cal ->
                        val isSelected = index == selectedDayIndex
                        DayChip(
                            dayLabel = SimpleDateFormat("EEE", Locale.US).format(cal.time),
                            dateLabel = cal.get(Calendar.DAY_OF_MONTH).toString(),
                            isSelected = isSelected,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedDayIndex = index; selectedHour = null }
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text("Available times", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(Modifier.height(6.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    LegendDot(color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                    Text(" Available", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(14.dp))
                    LegendDot(color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.35f))
                    Text(" Already booked", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Spacer(Modifier.height(8.dp))

                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    modifier = Modifier.fillMaxWidth().height(170.dp)
                ) {
                    items((openHour until closeHour).toList()) { hour ->
                        val isBooked = hour in bookedHours
                        val isPast = isToday && hour <= now.get(Calendar.HOUR_OF_DAY)
                        val isSelected = selectedHour == hour

                        Box(
                            modifier = Modifier
                                .padding(4.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(
                                    when {
                                        isSelected -> MaterialTheme.colorScheme.primary
                                        isPast -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                        isBooked -> MaterialTheme.colorScheme.secondary.copy(alpha = 0.35f)
                                        else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                                    }
                                )
                                .clickable(enabled = !isPast) { selectedHour = hour }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                String.format(Locale.US, "%02d:00", hour),
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val hour = selectedHour ?: return@Button
                    val result = (selectedCalendar.clone() as Calendar).apply {
                        set(Calendar.HOUR_OF_DAY, hour)
                        set(Calendar.MINUTE, 0)
                        set(Calendar.SECOND, 0)
                        set(Calendar.MILLISECOND, 0)
                    }
                    onConfirm(result.time)
                },
                enabled = selectedHour != null
            ) { Text("Confirm") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun DayChip(dayLabel: String, dateLabel: String, isSelected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(dayLabel, fontSize = 9.5.sp, color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant)
        Text(dateLabel, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun LegendDot(color: Color) {
    Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(color))
}

private fun isSameDay(a: Date, b: Date): Boolean {
    val ca = Calendar.getInstance().apply { time = a }
    val cb = Calendar.getInstance().apply { time = b }
    return ca.get(Calendar.YEAR) == cb.get(Calendar.YEAR) && ca.get(Calendar.DAY_OF_YEAR) == cb.get(Calendar.DAY_OF_YEAR)
}
