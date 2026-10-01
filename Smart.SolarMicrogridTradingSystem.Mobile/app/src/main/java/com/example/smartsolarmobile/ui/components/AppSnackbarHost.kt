package com.example.smartsolarmobile.ui.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartsolarmobile.util.NO_INTERNET_MESSAGE

/** Drop-in replacement for SnackbarHost that renders a WiFi-off icon alongside the message
 *  whenever it's the shared "no internet" text, instead of a plain line of text - use this
 *  everywhere a screen shows [com.example.smartsolarmobile.util.toFriendlyMessage] output. */
@Composable
fun AppSnackbarHost(hostState: SnackbarHostState, modifier: Modifier = Modifier) {
    SnackbarHost(hostState = hostState, modifier = modifier) { data ->
        val isOffline = data.visuals.message == NO_INTERNET_MESSAGE
        Snackbar(
            containerColor = MaterialTheme.colorScheme.inverseSurface,
            contentColor = MaterialTheme.colorScheme.inverseOnSurface
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isOffline) {
                    Icon(Icons.Default.WifiOff, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                }
                Text(data.visuals.message)
            }
        }
    }
}
