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

/** A horizontal battery-style slot indicator — mirrors the web app's Node Slots viewer
 *  (empty/green = available, full/amber = reserved) so both apps read the same way. */
@Composable
fun BatterySlot(
    slotNumber: Int,
    capacityKw: Double,
    isAvailable: Boolean,
    modifier: Modifier = Modifier
) {
    val fillColor = if (isAvailable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary
    val fillFraction by animateFloatAsState(
        targetValue = if (isAvailable) 0f else 1f,
        animationSpec = tween(durationMillis = 500),
        label = "batteryFill"
    )
    val label = if (isAvailable) "Available" else "Reserved"

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
                text = "${"%.1f".format(capacityKw)} kW",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
