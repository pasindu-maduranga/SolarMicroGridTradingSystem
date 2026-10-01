package com.example.smartsolarmobile.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** A horizontal battery-style slot indicator — mirrors the web app's Node Slots viewer. The fill
 *  reflects how much of today's shared capacity has actually been used (verified deliveries), not
 *  a plain available/reserved switch - a slot fills up gradually as multiple Prosumers deliver
 *  into it, rather than jumping straight to full on a single booking. */
@Composable
fun BatterySlot(
    slotNumber: Int,
    capacityKw: Double,
    isAvailable: Boolean,
    remainingCapacityKw: Double = if (isAvailable) capacityKw else 0.0,
    modifier: Modifier = Modifier
) {
    val isFull = remainingCapacityKw <= 0.0
    val usedFraction = if (capacityKw > 0) ((capacityKw - remainingCapacityKw) / capacityKw).toFloat() else 0f
    val fillColor = if (isFull) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
    val fillFraction by animateFloatAsState(
        targetValue = usedFraction.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 500),
        label = "batteryFill"
    )
    val label = if (isFull) "Full today" else "${"%.1f".format(remainingCapacityKw)} kW left"

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp, horizontal = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "SLOT $slotNumber",
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .width(56.dp)
                        .height(28.dp)
                        .border(2.dp, MaterialTheme.colorScheme.onSurfaceVariant, RoundedCornerShape(6.dp))
                        .padding(2.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(fillFraction.coerceIn(0f, 1f))
                            .background(fillColor, RoundedCornerShape(3.dp))
                    )
                }
                Box(
                    modifier = Modifier
                        .width(4.dp)
                        .height(12.dp)
                        .background(MaterialTheme.colorScheme.onSurfaceVariant, RoundedCornerShape(topEnd = 2.dp, bottomEnd = 2.dp))
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = fillColor,
                textAlign = TextAlign.Center
            )
            Text(
                text = "${"%.1f".format(remainingCapacityKw)} / ${"%.1f".format(capacityKw)} kW",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
