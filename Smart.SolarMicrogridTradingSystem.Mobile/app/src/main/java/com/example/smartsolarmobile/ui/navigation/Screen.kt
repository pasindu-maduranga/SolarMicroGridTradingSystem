package com.example.smartsolarmobile.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object GridOperatorHome : Screen("grid_operator_home")
    object ProsumerHome : Screen("prosumer_home")
    object ReserveSlot : Screen("reserve_slot")
    object BookingSummary : Screen("booking_summary")
    object BookingHistory : Screen("booking_history")
}
