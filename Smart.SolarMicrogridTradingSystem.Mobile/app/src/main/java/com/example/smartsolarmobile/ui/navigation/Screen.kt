package com.example.smartsolarmobile.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object GridOperatorHome : Screen("grid_operator_home")
    object ProsumerHome : Screen("prosumer_home")
}
