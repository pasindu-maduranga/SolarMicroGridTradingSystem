package com.example.smartsolarmobile.ui.home

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import kotlinx.coroutines.async
import androidx.compose.material.icons.filled.Payments
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smartsolarmobile.R
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.ui.components.DashboardStatCard
import com.example.smartsolarmobile.ui.components.GreetingHero
import com.example.smartsolarmobile.ui.components.MenuGridTile
import com.example.smartsolarmobile.ui.components.SideDrawerOverlay
import com.example.smartsolarmobile.ui.profile.EditProfileScreen
import com.example.smartsolarmobile.ui.profile.EditProfileViewModel
import com.example.smartsolarmobile.ui.profile.EditProfileViewModelFactory

private data class ProsumerMenuItem(
    val label: String,
    val iconRes: Int? = null,
    val icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    val onClick: () -> Unit
)

@Composable
fun ProsumerHomeScreen(
    session: UserSession,
    authRepository: AuthRepository,
    reservationRepository: ReservationRepository,
    onLogout: () -> Unit,
    onNavigateToReserve: () -> Unit,
    onNavigateToMyReservations: () -> Unit,
    onNavigateToEarnings: () -> Unit
) {
    var canReserve by remember { mutableStateOf(false) }
    var canViewReservations by remember { mutableStateOf(false) }
    var canViewEarnings by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }
    var activeReservationCount by remember { mutableStateOf<Int?>(null) }
    var totalBookingCount by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(session.roleId) {
        // Run in parallel, not sequentially - each check is a separate network round trip
        // (or timeout), and awaiting them one at a time made the total wait add up.
        val reserve = async { reservationRepository.hasAccess(session.roleId, "RESERVESLOT") }
        val reservations = async { reservationRepository.hasAccess(session.roleId, "MYRESERVATIONS") }
        val earnings = async { reservationRepository.hasAccess(session.roleId, "EARNINGS") }
        canReserve = reserve.await()
        canViewReservations = reservations.await()
        canViewEarnings = earnings.await()
    }

    val nicForStats = session.nic ?: session.username
    LaunchedEffect(canViewReservations, nicForStats) {
        if (canViewReservations) {
            reservationRepository.getMyReservations(nicForStats).onSuccess { list ->
                activeReservationCount = list.count { it.status == "Active" }
                totalBookingCount = list.size
            }
        }
    }

    val displayName = session.fullName.ifBlank { session.nic ?: session.username }

    val menuItems = buildList {
        if (canReserve) {
            add(
                ProsumerMenuItem(
                    label = "Reserve Energy",
                    iconRes = R.drawable.illustration_renewable_energy,
                    onClick = onNavigateToReserve
                )
            )
        }
        if (canViewReservations) {
            add(
                ProsumerMenuItem(
                    label = "My Reservations",
                    iconRes = R.drawable.illustration_booking,
                    onClick = onNavigateToMyReservations
                )
            )
        }
        if (canViewEarnings) {
            add(
                ProsumerMenuItem(
                    label = "Earnings",
                    icon = Icons.Default.Payments,
                    onClick = onNavigateToEarnings
                )
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            GreetingHero(
                displayName = displayName,
                subtitle = "Prosumer · NIC ${session.nic ?: session.username}",
                onLogout = onLogout,
                onProfileClick = { showEditProfile = true }
            )

            Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
                if (canViewReservations) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        DashboardStatCard(
                            label = "Active Reservations",
                            value = activeReservationCount,
                            modifier = Modifier.weight(1f)
                        )
                        DashboardStatCard(
                            label = "Total Bookings",
                            value = totalBookingCount,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                Text(
                    text = "What would you like to do?",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(14.dp))

                if (menuItems.isEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(modifier = Modifier.padding(16.dp)) {
                            Icon(Icons.Default.Badge, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Column(modifier = Modifier.padding(start = 12.dp)) {
                                Text("No features enabled yet", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text("Ask your Backoffice administrator to grant Prosumer permissions.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(menuItems, key = { it.label }) { item ->
                            MenuGridTile(
                                label = item.label,
                                iconRes = item.iconRes,
                                icon = item.icon,
                                iconSize = 84.dp,
                                onClick = item.onClick
                            )
                        }
                    }
                }
            }
        }

        val nic = session.nic ?: session.username
        SideDrawerOverlay(
            visible = showEditProfile,
            onDismiss = { showEditProfile = false }
        ) {
            val editProfileViewModel: EditProfileViewModel = viewModel(
                key = "edit_profile_$nic",
                factory = EditProfileViewModelFactory(authRepository, nic)
            )
            EditProfileScreen(
                viewModel = editProfileViewModel,
                onBack = { showEditProfile = false },
                onDeactivated = {
                    showEditProfile = false
                    onLogout()
                },
                onSignOut = {
                    showEditProfile = false
                    onLogout()
                }
            )
        }
    }
}
