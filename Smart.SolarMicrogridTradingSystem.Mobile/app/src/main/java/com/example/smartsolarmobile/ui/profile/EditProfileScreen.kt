package com.example.smartsolarmobile.ui.profile

import android.Manifest
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.smartsolarmobile.ui.components.AppSnackbarHost
import com.example.smartsolarmobile.ui.components.LocationPickerDialog
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun EditProfileScreen(
    viewModel: EditProfileViewModel,
    onBack: () -> Unit,
    onDeactivated: () -> Unit,
    onSignOut: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    var liveLatitude by remember { mutableStateOf<Double?>(null) }
    var liveLongitude by remember { mutableStateOf<Double?>(null) }

    val pickImageLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        if (bytes != null) {
            val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
            val extension = mimeType.substringAfter("/", "jpg")
            viewModel.uploadPhoto(bytes, "profile.$extension", mimeType)
        }
    }

    LaunchedEffect(Unit) { viewModel.load() }

    // Fetches the device's actual current GPS fix so "Use Current Location" reflects where the
    // Prosumer really is right now, instead of only ever offering their last saved location.
    LaunchedEffect(locationPermission.status) {
        if (locationPermission.status.isGranted) {
            val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            val lastKnown = providers.firstNotNullOfOrNull { provider ->
                try {
                    if (locationManager.isProviderEnabled(provider)) locationManager.getLastKnownLocation(provider) else null
                } catch (e: SecurityException) {
                    null
                }
            }
            liveLatitude = lastKnown?.latitude
            liveLongitude = lastKnown?.longitude
        }
    }

    LaunchedEffect(uiState.saved) {
        if (uiState.saved) snackbarHostState.showSnackbar("Profile updated.")
    }

    LaunchedEffect(uiState.deactivated) {
        if (uiState.deactivated) onDeactivated()
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text("Edit Profile") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.Close, contentDescription = "Close") }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        snackbarHost = { AppSnackbarHost(snackbarHostState) }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp)
            ) {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Box(contentAlignment = Alignment.BottomEnd) {
                        Box(
                            modifier = Modifier
                                .size(96.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            when {
                                uiState.isUploadingPhoto -> CircularProgressIndicator(modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                                uiState.profilePictureUrl != null -> AsyncImage(
                                    model = uiState.profilePictureUrl,
                                    contentDescription = "Profile photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                else -> Icon(
                                    Icons.Default.Person,
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(
                            onClick = { pickImageLauncher.launch("image/*") },
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.onSurface)
                        ) {
                            Icon(
                                Icons.Default.CameraAlt,
                                contentDescription = "Change photo",
                                tint = Color.White,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))

                ProfileSectionCard {
                    UnderlineField(
                        label = "First name",
                        value = uiState.firstName,
                        onValueChange = viewModel::onFirstNameChanged
                    )
                    UnderlineField(
                        label = "Last name",
                        value = uiState.lastName,
                        onValueChange = viewModel::onLastNameChanged
                    )
                    UnderlineField(
                        label = "Email",
                        value = uiState.email,
                        onValueChange = viewModel::onEmailChanged,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
                    )
                    UnderlineField(
                        label = "Phone number",
                        value = uiState.phoneNumber,
                        onValueChange = viewModel::onPhoneChanged,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next)
                    )
                    UnderlineField(
                        label = "Address",
                        value = uiState.address,
                        onValueChange = viewModel::onAddressChanged,
                        singleLine = false,
                        isLast = true
                    )
                }

                Spacer(Modifier.height(20.dp))
                Text(
                    "Live Location",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(Modifier.height(10.dp))
                ProfileSectionCard {
                    if (uiState.latitude != null && uiState.longitude != null) {
                        Text(
                            "Lat: ${"%.5f".format(uiState.latitude)}, Lng: ${"%.5f".format(uiState.longitude)}",
                            fontSize = 12.5.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Text(
                            "No location set yet.",
                            fontSize = 12.5.sp,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    if (!locationPermission.status.isGranted) {
                        NeutralOutlinedButton(
                            onClick = { locationPermission.launchPermissionRequest() },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.height(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Allow Location Access")
                        }
                        Spacer(Modifier.height(8.dp))
                    } else {
                        NeutralOutlinedButton(
                            onClick = {
                                val lat = liveLatitude
                                val lng = liveLongitude
                                if (lat != null && lng != null) {
                                    viewModel.onLocationPicked(lat, lng)
                                }
                            },
                            enabled = liveLatitude != null && liveLongitude != null,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.height(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Use Current Location")
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                    NeutralOutlinedButton(
                        onClick = { viewModel.showLocationPicker() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.height(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(if (uiState.latitude != null) "Update Location on Map" else "Set Location on Map")
                    }
                }

                Spacer(Modifier.height(28.dp))
                Button(
                    onClick = { viewModel.save() },
                    enabled = !uiState.isSaving,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.onSurface,
                        contentColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth().height(50.dp)
                ) {
                    if (uiState.isSaving) {
                        CircularProgressIndicator(modifier = Modifier.height(18.dp), strokeWidth = 2.dp, color = Color.White)
                    } else {
                        Text("Save Changes", fontWeight = FontWeight.SemiBold)
                    }
                }

                Spacer(Modifier.height(12.dp))
                NeutralOutlinedButton(
                    onClick = onSignOut,
                    modifier = Modifier.fillMaxWidth().height(50.dp)
                ) {
                    Text("Sign Out", fontWeight = FontWeight.SemiBold)
                }

                Spacer(Modifier.height(32.dp))
                Text(
                    "Danger zone",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Requesting deactivation will sign you out immediately. Only a Backoffice officer can reactivate your account afterwards.",
                    fontSize = 12.5.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { viewModel.requestDeactivateConfirm() },
                    enabled = !uiState.isSaving,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Request Account Deactivation")
                }
            }
        }
    }

    if (uiState.showLocationPicker) {
        LocationPickerDialog(
            initialLat = uiState.latitude ?: liveLatitude,
            initialLng = uiState.longitude ?: liveLongitude,
            onDismiss = { viewModel.dismissLocationPicker() },
            onConfirm = { lat, lng -> viewModel.onLocationPicked(lat, lng) }
        )
    }

    if (uiState.showDeactivateConfirm) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissDeactivateConfirm() },
            title = { Text("Deactivate your account?") },
            text = { Text("You'll be signed out right away, and will need a Backoffice officer to reactivate your account before you can log in again.") },
            confirmButton = {
                Button(onClick = { viewModel.confirmDeactivate() }) { Text("Deactivate") }
            },
            dismissButton = {
                OutlinedButton(onClick = { viewModel.dismissDeactivateConfirm() }) { Text("Cancel") }
            }
        )
    }
}

/** Minimal label-above / underline-below field (no box border) - matches a clean "Edit Profile"
 *  look instead of Material3's boxed OutlinedTextField. */
@Composable
private fun UnderlineField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    singleLine: Boolean = true,
    isLast: Boolean = false
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(),
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(4.dp))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = singleLine,
            keyboardOptions = keyboardOptions,
            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface),
            cursorBrush = SolidColor(MaterialTheme.colorScheme.onSurface),
            modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)
        )
        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.35f), thickness = 1.dp)
        if (!isLast) Spacer(Modifier.height(16.dp))
    }
}

/** Plain white card used to group related fields/actions - replaces the previous tinted
 *  background block so the screen reads as clean and neutral instead of using brand color. */
@Composable
private fun ProfileSectionCard(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}

/** Outlined button in a neutral ink/gray tone - used for Sign Out and the location actions so
 *  they don't compete visually with the brand-gold primary color used elsewhere in the app. */
@Composable
private fun NeutralOutlinedButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onSurface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier = modifier,
        content = content
    )
}
