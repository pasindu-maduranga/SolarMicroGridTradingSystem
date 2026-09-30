package com.example.smartsolarmobile.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object GridOperatorHome : Screen("grid_operator_home")
    object ProsumerHome : Screen("prosumer_home")
    object ReserveSlot : Screen("reserve_slot")
    object MyReservations : Screen("my_reservations")
    object Earnings : Screen("earnings")
    object VerifyReservation : Screen("verify_reservation")
    object MyNodeSlots : Screen("my_node_slots")
    object OperatorBookings : Screen("operator_bookings")
    object TransactionHistory : Screen("transaction_history")
}
