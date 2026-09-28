package com.example.smartsolarmobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smartsolarmobile.data.api.models.UserRole
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.ui.auth.LoginScreen
import com.example.smartsolarmobile.ui.auth.LoginViewModel
import com.example.smartsolarmobile.ui.auth.LoginViewModelFactory
import com.example.smartsolarmobile.ui.auth.SignupScreen
import com.example.smartsolarmobile.ui.auth.SignupViewModel
import com.example.smartsolarmobile.ui.auth.SignupViewModelFactory
import com.example.smartsolarmobile.ui.home.GridOperatorHomeScreen
import com.example.smartsolarmobile.ui.home.ProsumerHomeScreen

@Composable
fun AppNavGraph(
    authRepository: AuthRepository
) {
    var currentScreen by remember {
        mutableStateOf<Screen>(
            if (authRepository.isLoggedIn()) {
                val session = authRepository.getSavedSession()
                if (session?.userRole == UserRole.GRID_OPERATOR || session?.userRole == UserRole.BACKOFFICE) {
                    Screen.GridOperatorHome
                } else {
                    Screen.ProsumerHome
                }
            } else {
                Screen.Login
            }
        )
    }

    var activeSession by remember { mutableStateOf(authRepository.getSavedSession()) }

    when (currentScreen) {
        Screen.Login -> {
            val loginViewModel: LoginViewModel = viewModel(
                factory = LoginViewModelFactory(authRepository)
            )
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = { session ->
                    activeSession = session
                    currentScreen = if (session.userRole == UserRole.GRID_OPERATOR || session.userRole == UserRole.BACKOFFICE) {
                        Screen.GridOperatorHome
                    } else {
                        Screen.ProsumerHome
                    }
                },
                onNavigateToSignup = {
                    currentScreen = Screen.Signup
                }
            )
        }

        Screen.Signup -> {
            val signupViewModel: SignupViewModel = viewModel(
                factory = SignupViewModelFactory(authRepository)
            )
            SignupScreen(
                viewModel = signupViewModel,
                onNavigateBackToLogin = {
                    currentScreen = Screen.Login
                },
                onSignupSuccess = {
                    currentScreen = Screen.Login
                }
            )
        }

        Screen.GridOperatorHome -> {
            activeSession?.let { session ->
                GridOperatorHomeScreen(
                    session = session,
                    onLogout = {
                        authRepository.logout()
                        activeSession = null
                        currentScreen = Screen.Login
                    }
                )
            } ?: run {
                currentScreen = Screen.Login
            }
        }

        Screen.ProsumerHome -> {
            activeSession?.let { session ->
                ProsumerHomeScreen(
                    session = session,
                    onLogout = {
                        authRepository.logout()
                        activeSession = null
                        currentScreen = Screen.Login
                    }
                )
            } ?: run {
                currentScreen = Screen.Login
            }
        }
    }
}
