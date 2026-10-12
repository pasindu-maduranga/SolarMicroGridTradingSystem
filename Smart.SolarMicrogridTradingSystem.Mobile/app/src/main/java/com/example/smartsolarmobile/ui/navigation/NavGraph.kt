package com.example.smartsolarmobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smartsolarmobile.data.api.models.UserRole
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.local.LocalUserDatabase
import com.example.smartsolarmobile.data.local.NetworkMonitor
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.theme.AppThemeVariant
import com.example.smartsolarmobile.theme.SmartSolarMobileTheme
import com.example.smartsolarmobile.ui.auth.LoginScreen
import com.example.smartsolarmobile.ui.auth.LoginViewModel
import com.example.smartsolarmobile.ui.auth.LoginViewModelFactory
import com.example.smartsolarmobile.ui.auth.SignupScreen
import com.example.smartsolarmobile.ui.auth.SignupViewModel
import com.example.smartsolarmobile.ui.auth.SignupViewModelFactory
import com.example.smartsolarmobile.data.repository.ReservationRepository
import com.example.smartsolarmobile.ui.home.GridOperatorHomeScreen
import com.example.smartsolarmobile.ui.home.ProsumerHomeScreen
import com.example.smartsolarmobile.ui.reservation.MyNodeSlotsScreen
import com.example.smartsolarmobile.ui.reservation.MyNodeSlotsViewModelFactory
import com.example.smartsolarmobile.ui.reservation.MyReservationsScreen
import com.example.smartsolarmobile.ui.reservation.MyReservationsViewModelFactory
import com.example.smartsolarmobile.ui.reservation.ReserveSlotScreen
import com.example.smartsolarmobile.ui.reservation.ReserveSlotViewModelFactory
import com.example.smartsolarmobile.ui.reservation.VerifyReservationScreen
import com.example.smartsolarmobile.ui.reservation.VerifyReservationViewModelFactory
import com.example.smartsolarmobile.ui.reservation.EarningsScreen
import com.example.smartsolarmobile.ui.reservation.EarningsViewModelFactory
import com.example.smartsolarmobile.ui.reservation.OperatorBookingsScreen
import com.example.smartsolarmobile.ui.reservation.OperatorBookingsViewModelFactory
import com.example.smartsolarmobile.ui.reservation.TransactionHistoryScreen
import com.example.smartsolarmobile.ui.reservation.TransactionHistoryViewModelFactory

@Composable
fun AppNavGraph(
    authRepository: AuthRepository,
    networkMonitor: NetworkMonitor
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

    // Grid Operators (and Backoffice) keep the shared web-portal green brand;
    // Prosumers get the warmer gold accent once they're signed in.
    val themeVariant = when (activeSession?.userRole) {
        UserRole.PROSUMER -> AppThemeVariant.PROSUMER
        UserRole.GRID_OPERATOR, UserRole.BACKOFFICE -> AppThemeVariant.GRID_OPERATOR
        null -> AppThemeVariant.DEFAULT
    }

    SmartSolarMobileTheme(variant = themeVariant) {
        NavGraphContent(
            currentScreen = currentScreen,
            activeSession = activeSession,
            authRepository = authRepository,
            networkMonitor = networkMonitor,
            onScreenChange = { currentScreen = it },
            onSessionChange = { activeSession = it }
        )
    }
}

@Composable
private fun NavGraphContent(
    currentScreen: Screen,
    activeSession: UserSession?,
    authRepository: AuthRepository,
    networkMonitor: NetworkMonitor,
    onScreenChange: (Screen) -> Unit,
    onSessionChange: (UserSession?) -> Unit
) {
    val context = LocalContext.current
    // One shared LocalUserDatabase/ReservationRepository for the whole nav graph - each Home
    // screen used to create its own, opening a separate SQLite connection per instance, which
    // showed up as "SQLiteConnectionPool leaked" warnings and synchronous disk I/O jank.
    val localUserDatabase = remember { LocalUserDatabase(context) }
    val reservationRepository = remember {
        ReservationRepository(localUserDatabase = localUserDatabase, networkMonitor = networkMonitor)
    }

    when (currentScreen) {
        Screen.Login -> {
            val loginViewModel: LoginViewModel = viewModel(
                factory = LoginViewModelFactory(authRepository)
            )
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = { session ->
                    onSessionChange(session)
                    onScreenChange(
                        if (session.userRole == UserRole.GRID_OPERATOR || session.userRole == UserRole.BACKOFFICE) {
                            Screen.GridOperatorHome
                        } else {
                            Screen.ProsumerHome
                        }
                    )
                },
                onNavigateToSignup = {
                    onScreenChange(Screen.Signup)
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
                    onScreenChange(Screen.Login)
                },
                onSignupSuccess = {
                    onScreenChange(Screen.Login)
                }
            )
        }

        Screen.GridOperatorHome -> {
            activeSession?.let { session ->
                GridOperatorHomeScreen(
                    session = session,
                    reservationRepository = reservationRepository,
                    onLogout = {
                        authRepository.logout()
                        onSessionChange(null)
                        onScreenChange(Screen.Login)
                    },
                    onNavigateToVerify = { onScreenChange(Screen.VerifyReservation) },
                    onNavigateToMyNodeSlots = { onScreenChange(Screen.MyNodeSlots) },
                    onNavigateToBookings = { onScreenChange(Screen.OperatorBookings) },
                    onNavigateToTransactionHistory = { onScreenChange(Screen.TransactionHistory) }
                )
            } ?: run {
                onScreenChange(Screen.Login)
            }
        }

        Screen.ProsumerHome -> {
            activeSession?.let { session ->
                ProsumerHomeScreen(
                    session = session,
                    authRepository = authRepository,
                    reservationRepository = reservationRepository,
                    onLogout = {
                        authRepository.logout()
                        onSessionChange(null)
                        onScreenChange(Screen.Login)
                    },
                    onNavigateToReserve = { onScreenChange(Screen.ReserveSlot) },
                    onNavigateToMyReservations = { onScreenChange(Screen.MyReservations) },
                    onNavigateToEarnings = { onScreenChange(Screen.Earnings) }
                )
            } ?: run {
                onScreenChange(Screen.Login)
            }
        }

        Screen.ReserveSlot -> {
            val nic = activeSession?.nic
            if (nic == null) {
                onScreenChange(Screen.Login)
            } else {
                val vm = viewModel<com.example.smartsolarmobile.ui.reservation.ReserveSlotViewModel>(
                    key = "reserve_slot_$nic",
                    factory = ReserveSlotViewModelFactory(reservationRepository, authRepository, nic)
                )
                ReserveSlotScreen(viewModel = vm, onBack = { onScreenChange(Screen.ProsumerHome) })
            }
        }

        Screen.MyReservations -> {
            val nic = activeSession?.nic
            if (nic == null) {
                onScreenChange(Screen.Login)
            } else {
                val vm = viewModel<com.example.smartsolarmobile.ui.reservation.MyReservationsViewModel>(
                    key = "my_reservations_$nic",
                    factory = MyReservationsViewModelFactory(reservationRepository, nic)
                )
                MyReservationsScreen(viewModel = vm, onBack = { onScreenChange(Screen.ProsumerHome) })
            }
        }

        Screen.Earnings -> {
            val nic = activeSession?.nic
            if (nic == null) {
                onScreenChange(Screen.Login)
            } else {
                val vm = viewModel<com.example.smartsolarmobile.ui.reservation.EarningsViewModel>(
                    key = "earnings_$nic",
                    factory = EarningsViewModelFactory(reservationRepository, nic)
                )
                EarningsScreen(viewModel = vm, onBack = { onScreenChange(Screen.ProsumerHome) })
            }
        }

        Screen.VerifyReservation -> {
            val verifiedBy = activeSession?.username ?: "Grid Operator"
            val vm = viewModel<com.example.smartsolarmobile.ui.reservation.VerifyReservationViewModel>(
                key = "verify_reservation_$verifiedBy",
                factory = VerifyReservationViewModelFactory(reservationRepository, verifiedBy)
            )
            VerifyReservationScreen(viewModel = vm, onBack = { onScreenChange(Screen.GridOperatorHome) })
        }

        Screen.MyNodeSlots -> {
            val userId = activeSession?.userId ?: ""
            val vm = viewModel<com.example.smartsolarmobile.ui.reservation.MyNodeSlotsViewModel>(
                key = "my_node_slots_$userId",
                factory = MyNodeSlotsViewModelFactory(reservationRepository, userId)
            )
            MyNodeSlotsScreen(viewModel = vm, onBack = { onScreenChange(Screen.GridOperatorHome) })
        }

        Screen.OperatorBookings -> {
            val userId = activeSession?.userId ?: ""
            val vm = viewModel<com.example.smartsolarmobile.ui.reservation.OperatorBookingsViewModel>(
                key = "operator_bookings_$userId",
                factory = OperatorBookingsViewModelFactory(reservationRepository, userId)
            )
            OperatorBookingsScreen(viewModel = vm, onBack = { onScreenChange(Screen.GridOperatorHome) })
        }

        Screen.TransactionHistory -> {
            val userId = activeSession?.userId ?: ""
            val vm = viewModel<com.example.smartsolarmobile.ui.reservation.TransactionHistoryViewModel>(
                key = "transaction_history_$userId",
                factory = TransactionHistoryViewModelFactory(reservationRepository, userId)
            )
            TransactionHistoryScreen(viewModel = vm, onBack = { onScreenChange(Screen.GridOperatorHome) })
        }
    }
}
