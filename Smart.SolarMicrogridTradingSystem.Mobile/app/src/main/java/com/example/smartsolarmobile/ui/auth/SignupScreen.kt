package com.example.smartsolarmobile.ui.auth

import android.Manifest
import android.location.LocationManager
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.R
import com.example.smartsolarmobile.ui.components.AppSnackbarHost
import com.example.smartsolarmobile.ui.components.CurvedBottomShape
import com.example.smartsolarmobile.ui.components.CustomTextField
import com.example.smartsolarmobile.ui.components.LocationPickerDialog
import com.example.smartsolarmobile.ui.components.PrimaryButton
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun SignupScreen(
    viewModel: SignupViewModel,
    onNavigateBackToLogin: () -> Unit,
    onSignupSuccess: () -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var isPasswordVisible by remember { mutableStateOf(false) }
    var isConfirmPasswordVisible by remember { mutableStateOf(false) }
    var showMapPicker by remember { mutableStateOf(false) }

    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearMessages()
        }
    }

    fun useCurrentLocation() {
        if (!locationPermission.status.isGranted) {
            locationPermission.launchPermissionRequest()
            return
        }
        viewModel.setLocating(true)
        try {
            val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            val lastKnown = providers.firstNotNullOfOrNull { provider ->
                try {
                    if (locationManager.isProviderEnabled(provider)) locationManager.getLastKnownLocation(provider) else null
                } catch (e: SecurityException) {
                    null
                }
            }
            if (lastKnown != null) {
                viewModel.onLocationPicked(lastKnown.latitude, lastKnown.longitude)
            } else {
                viewModel.onLocationError("Couldn't get your current location — try picking it on the map instead.")
            }
        } catch (e: Exception) {
            viewModel.onLocationError(e.message ?: "Couldn't get your current location.")
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Hero — a distinct curved section, but in a light tone close to the illustration's
            // own white background so it blends instead of showing as a boxed-in graphic.
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(elevation = 3.dp, shape = CurvedBottomShape())
                    .clip(CurvedBottomShape())
                    .background(Color(0xFFF4F1E8))
            ) {
                // Full-bleed watermark — sharp, just low-opacity so it reads as a background
                // texture behind the text rather than a separate boxed photo.
                Image(
                    painter = painterResource(id = R.drawable.illustration_renewable_energy),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    alpha = 1f,
                    modifier = Modifier.fillMaxSize()
                )

                IconButton(
                    onClick = onNavigateBackToLogin,
                    modifier = Modifier.align(Alignment.TopStart).padding(top = 6.dp, start = 4.dp)
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back to Login",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }

                Column(
                    modifier = Modifier.fillMaxSize().padding(top = 48.dp, start = 28.dp, end = 28.dp, bottom = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Join the Smart Solar Trading Microgrid",
                        fontSize = 21.sp,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Register as an Energy Producer / Consumer",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CustomTextField(
                            value = uiState.nic,
                            onValueChange = { viewModel.onNicChanged(it) },
                            label = "NIC Number",
                            leadingIcon = Icons.Default.Badge,
                            errorMessage = uiState.nicError,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            CustomTextField(
                                value = uiState.firstName,
                                onValueChange = { viewModel.onFirstNameChanged(it) },
                                label = "First",
                                leadingIcon = Icons.Default.Person,
                                errorMessage = uiState.firstNameError,
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                            )

                            CustomTextField(
                                value = uiState.lastName,
                                onValueChange = { viewModel.onLastNameChanged(it) },
                                label = "Last",
                                errorMessage = uiState.lastNameError,
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        CustomTextField(
                            value = uiState.email,
                            onValueChange = { viewModel.onEmailChanged(it) },
                            label = "Email Address",
                            leadingIcon = Icons.Default.Email,
                            errorMessage = uiState.emailError,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        CustomTextField(
                            value = uiState.phoneNumber,
                            onValueChange = { viewModel.onPhoneChanged(it) },
                            label = "Phone Number",
                            leadingIcon = Icons.Default.Phone,
                            errorMessage = uiState.phoneError,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        CustomTextField(
                            value = uiState.address,
                            onValueChange = { viewModel.onAddressChanged(it) },
                            label = "Address / Node Location",
                            leadingIcon = Icons.Default.Home,
                            errorMessage = uiState.addressError,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Location capture — required so Backoffice/Grid Operator can see
                        // exactly where this Prosumer is, not just a free-text address.
                        Column(modifier = Modifier.fillMaxWidth()) {
                            if (uiState.latitude != null && uiState.longitude != null) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp, vertical = 10.dp)
                                ) {
                                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Location set (${"%.4f".format(uiState.latitude)}, ${"%.4f".format(uiState.longitude)})",
                                        fontSize = 12.5.sp,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Text(
                                        text = "Change",
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.clickable { showMapPicker = true }
                                    )
                                }
                            } else {
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                                    OutlinedButton(
                                        onClick = { useCurrentLocation() },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        if (uiState.isLocating) {
                                            CircularProgressIndicator(modifier = Modifier.height(16.dp))
                                        } else {
                                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.height(18.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("My Location", fontSize = 12.5.sp)
                                        }
                                    }
                                    OutlinedButton(
                                        onClick = { showMapPicker = true },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(Icons.Default.Map, contentDescription = null, modifier = Modifier.height(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Pick on Map", fontSize = 12.5.sp)
                                    }
                                }
                                if (uiState.locationError != null) {
                                    Text(
                                        text = uiState.locationError!!,
                                        color = MaterialTheme.colorScheme.error,
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        CustomTextField(
                            value = uiState.password,
                            onValueChange = { viewModel.onPasswordChanged(it) },
                            label = "Password",
                            leadingIcon = Icons.Default.Lock,
                            trailingIcon = if (isPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            onTrailingIconClick = { isPasswordVisible = !isPasswordVisible },
                            visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            errorMessage = uiState.passwordError,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        CustomTextField(
                            value = uiState.confirmPassword,
                            onValueChange = { viewModel.onConfirmPasswordChanged(it) },
                            label = "Confirm Password",
                            leadingIcon = Icons.Default.Lock,
                            trailingIcon = if (isConfirmPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            onTrailingIconClick = { isConfirmPasswordVisible = !isConfirmPasswordVisible },
                            visualTransformation = if (isConfirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            errorMessage = uiState.confirmPasswordError,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done)
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        PrimaryButton(
                            text = "Register Prosumer Account",
                            onClick = { viewModel.registerProsumer() },
                            isLoading = uiState.isLoading
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateBackToLogin() }
                                .heightIn(min = 48.dp)
                                .padding(vertical = 12.dp)
                        ) {
                            Text(
                                text = "Already registered? ",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Log In",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }

        AppSnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        )
    }

    if (showMapPicker) {
        LocationPickerDialog(
            initialLat = uiState.latitude,
            initialLng = uiState.longitude,
            onDismiss = { showMapPicker = false },
            onConfirm = { lat, lng ->
                viewModel.onLocationPicked(lat, lng)
                showMapPicker = false
            }
        )
    }

    if (uiState.isSuccess && uiState.successMessage != null) {
        AlertDialog(
            onDismissRequest = { },
            icon = { Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            title = { Text("Registration Submitted!", textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
            text = {
                Text(
                    text = uiState.successMessage ?: "",
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearMessages()
                        onSignupSuccess()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Continue to Login")
                }
            }
        )
    }
}
