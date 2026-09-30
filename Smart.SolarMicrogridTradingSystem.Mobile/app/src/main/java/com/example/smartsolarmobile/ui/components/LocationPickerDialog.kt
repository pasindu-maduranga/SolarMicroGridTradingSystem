package com.example.smartsolarmobile.ui.components

import android.Manifest
import android.location.Geocoder
import android.location.LocationManager
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.rememberCameraPositionState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

private val SRI_LANKA_CENTER = LatLng(7.8731, 80.7718)

/** Full-screen dialog with a pan/zoom map and a fixed centre pin (drag the map, not the pin —
 *  the pin always marks the map's centre) so the user can precisely pick their location.
 *  Also offers a free-text place search (Android's built-in Geocoder - no extra API/key) and a
 *  "jump to my current GPS position" button. */
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationPickerDialog(
    initialLat: Double? = null,
    initialLng: Double? = null,
    onDismiss: () -> Unit,
    onConfirm: (Double, Double) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)

    val startPoint = if (initialLat != null && initialLng != null) LatLng(initialLat, initialLng) else SRI_LANKA_CENTER
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(startPoint, 14f)
    }
    val centerPoint = cameraPositionState.position.target

    var searchQuery by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var searchError by remember { mutableStateOf<String?>(null) }
    var isLocating by remember { mutableStateOf(false) }

    fun search() {
        if (searchQuery.isBlank()) return
        scope.launch {
            isSearching = true
            searchError = null
            val result = withContext(Dispatchers.IO) {
                try {
                    // Biased to Sri Lanka's bounding box so a short query like "Colombo" resolves
                    // to the local match instead of an unrelated place elsewhere in the world.
                    @Suppress("DEPRECATION")
                    Geocoder(context, Locale.getDefault())
                        .getFromLocationName(searchQuery, 3, 5.9, 79.5, 9.9, 82.1)
                        ?.firstOrNull()
                } catch (e: Exception) {
                    null
                }
            }
            isSearching = false
            if (result != null) {
                cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(LatLng(result.latitude, result.longitude), 14f))
            } else {
                searchError = "Couldn't find that place - try a different search."
            }
        }
    }

    fun useCurrentLocation() {
        if (!locationPermission.status.isGranted) {
            locationPermission.launchPermissionRequest()
            return
        }
        scope.launch {
            isLocating = true
            val point = withContext(Dispatchers.IO) {
                val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
                val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
                providers.firstNotNullOfOrNull { provider ->
                    try {
                        if (locationManager.isProviderEnabled(provider)) locationManager.getLastKnownLocation(provider) else null
                    } catch (e: SecurityException) {
                        null
                    }
                }
            }
            isLocating = false
            if (point != null) {
                cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(LatLng(point.latitude, point.longitude), 14f))
            } else {
                searchError = "Couldn't get your current GPS position - make sure location is enabled."
            }
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Column(
                modifier = Modifier.fillMaxSize(),
            ) {
                Box(modifier = Modifier.fillMaxWidth().height(56.dp)) {
                    Text(
                        text = "Pick your location",
                        modifier = Modifier.align(Alignment.CenterStart).padding(start = 8.dp),
                        color = MaterialTheme.colorScheme.onBackground,
                        style = MaterialTheme.typography.titleMedium
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.align(Alignment.CenterEnd)) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp)
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it; searchError = null },
                        placeholder = { Text("Search for a place or address", style = MaterialTheme.typography.bodySmall) },
                        singleLine = true,
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = androidx.compose.foundation.text.KeyboardActions(onSearch = { search() }),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.size(6.dp))
                    IconButton(onClick = { search() }, enabled = !isSearching) {
                        if (isSearching) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Search, contentDescription = "Search")
                        }
                    }
                }
                searchError?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 8.dp))
                }

                Box(modifier = Modifier.fillMaxWidth().weight(1f)) {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState
                    )

                    // Fixed centre pin — the map moves underneath it.
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center).padding(bottom = 32.dp)
                    )

                    Surface(
                        onClick = { useCurrentLocation() },
                        shape = CircleShape,
                        tonalElevation = 4.dp,
                        modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp).size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (isLocating) {
                                CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.MyLocation, contentDescription = "Use my current location")
                            }
                        }
                    }
                }

                Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                    Text(
                        text = "Lat: ${"%.5f".format(centerPoint.latitude)}, Lng: ${"%.5f".format(centerPoint.longitude)}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { onConfirm(centerPoint.latitude, centerPoint.longitude) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Confirm this location")
                    }
                }
            }
        }
    }
}
