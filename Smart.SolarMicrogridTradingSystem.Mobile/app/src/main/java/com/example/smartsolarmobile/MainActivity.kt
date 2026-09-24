package com.example.smartsolarmobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.smartsolarmobile.data.local.TokenManager
import com.example.smartsolarmobile.data.repository.AuthRepository
import com.example.smartsolarmobile.theme.SmartSolarMobileTheme
import com.example.smartsolarmobile.ui.navigation.AppNavGraph

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val tokenManager = TokenManager(applicationContext)
        val authRepository = AuthRepository(tokenManager = tokenManager)

        setContent {
            SmartSolarMobileTheme {
                AppNavGraph(authRepository = authRepository)
            }
        }
    }
}
