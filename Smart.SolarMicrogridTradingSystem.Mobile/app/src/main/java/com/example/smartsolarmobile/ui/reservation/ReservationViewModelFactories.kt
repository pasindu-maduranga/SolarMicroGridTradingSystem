package com.example.smartsolarmobile.ui.reservation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.data.repository.ReservationRepository

class ReserveSlotViewModelFactory(
    private val repository: ReservationRepository,
    private val authRepository: AuthRepository,
    private val prosumerNic: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ReserveSlotViewModel::class.java)) {
            return ReserveSlotViewModel(repository, authRepository, prosumerNic) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}

class MyReservationsViewModelFactory(
    private val repository: ReservationRepository,
    private val prosumerNic: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MyReservationsViewModel::class.java)) {
            return MyReservationsViewModel(repository, prosumerNic) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}

class EarningsViewModelFactory(
    private val repository: ReservationRepository,
    private val prosumerNic: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(EarningsViewModel::class.java)) {
            return EarningsViewModel(repository, prosumerNic) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}

class VerifyReservationViewModelFactory(
    private val repository: ReservationRepository,
    private val verifiedBy: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(VerifyReservationViewModel::class.java)) {
            return VerifyReservationViewModel(repository, verifiedBy) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
