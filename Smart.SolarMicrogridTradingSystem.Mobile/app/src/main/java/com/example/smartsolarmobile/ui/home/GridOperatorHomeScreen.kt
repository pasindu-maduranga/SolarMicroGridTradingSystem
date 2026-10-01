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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
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
import kotlinx.coroutines.async
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.R
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.ui.components.DashboardStatCard
import com.example.smartsolarmobile.ui.components.GreetingHero
import com.example.smartsolarmobile.ui.components.MenuGridTile

private data class OperatorMenuItem(
    val label: String,
    val iconRes: Int? = null,
    val icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    val onClick: () -> Unit
)

@Composable
fun GridOperatorHomeScreen(
    session: UserSession,
    reservationRepository: ReservationRepository,
    onLogout: () -> Unit,
    onNavigateToVerify: () -> Unit,
    onNavigateToMyNodeSlots: () -> Unit,
    onNavigateToBookings: () -> Unit,
    onNavigateToTransactionHistory: () -> Unit
) {
    var canVerify by remember { mutableStateOf(false) }
    var canViewSlots by remember { mutableStateOf(false) }
    var canViewBookings by remember { mutableStateOf(false) }
    var canViewTransactions by remember { mutableStateOf(false) }
    var activeBookingCount by remember { mutableStateOf<Int?>(null) }
    var completedCount by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(session.roleId) {
        // Run in parallel, not sequentially - each check is a separate network round trip
        // (or timeout), and awaiting them one at a time made the total wait add up.
        val verify = async { reservationRepository.hasAccess(session.roleId, "VERIFYRESERVATION") }
        val slots = async { reservationRepository.hasAccess(session.roleId, "MYNODESLOTS") }
        val bookings = async { reservationRepository.hasAccess(session.roleId, "OPERATORBOOKINGS") }
        val transactions = async { reservationRepository.hasAccess(session.roleId, "TRANSACTIONHISTORY") }
        canVerify = verify.await()
        canViewSlots = slots.await()
        canViewBookings = bookings.await()
        canViewTransactions = transactions.await()
    }

    LaunchedEffect(canViewBookings, session.userId) {
        if (canViewBookings) {
            reservationRepository.getAllNodes().onSuccess { nodes ->
                val myNode = nodes.firstOrNull { it.assignedGridOperatorUserId == session.userId }
                if (myNode != null) {
                    reservationRepository.getReservationsByNode(myNode.nodeId).onSuccess { list ->
                        activeBookingCount = list.count { it.status == "Active" }
                        completedCount = list.count { it.status == "Completed" }
                    }
                }
            }
        }
    }

    val displayName = session.fullName.ifBlank { session.username }

    val menuItems = buildList {
        if (canVerify) {
            add(
                OperatorMenuItem(
                    label = "Verify Reservation",
                    iconRes = R.drawable.illustration_qr_scan,
                    onClick = onNavigateToVerify
                )
            )
        }
        if (canViewSlots) {
            add(
                OperatorMenuItem(
                    label = "My Node Slots",
                    iconRes = R.drawable.illustration_solar_panel,
                    onClick = onNavigateToMyNodeSlots
                )
            )
        }
        if (canViewBookings) {
            add(
                OperatorMenuItem(
                    label = "My Bookings",
                    iconRes = R.drawable.illustration_bookings,
                    onClick = onNavigateToBookings
                )
            )
        }
        if (canViewTransactions) {
            add(
                OperatorMenuItem(
                    label = "Transaction History",
                    iconRes = R.drawable.illustration_transactions,
                    onClick = onNavigateToTransactionHistory
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
                subtitle = "Grid Operator · ${session.username}",
                onLogout = onLogout
            )

            Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
                if (canViewBookings) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        DashboardStatCard(
                            label = "Active Bookings",
                            value = activeBookingCount,
                            modifier = Modifier.weight(1f)
                        )
                        DashboardStatCard(
                            label = "Completed",
                            value = completedCount,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                Text(
                    text = "Operator Capabilities",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(14.dp))

                if (menuItems.isEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                            Column(modifier = Modifier.padding(start = 12.dp)) {
                                Text("No mobile features enabled yet", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                Text("Ask your Backoffice administrator to grant Grid Operator Mobile permissions.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
    }
}
