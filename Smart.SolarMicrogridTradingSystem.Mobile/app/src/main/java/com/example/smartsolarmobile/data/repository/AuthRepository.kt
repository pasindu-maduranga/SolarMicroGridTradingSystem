package com.example.smartsolarmobile.data.repository

import android.util.Base64
import com.example.smartsolarmobile.data.api.ApiService
import com.example.smartsolarmobile.data.api.RetrofitClient
import com.example.smartsolarmobile.data.api.models.LoginRequest
import com.example.smartsolarmobile.data.api.models.ProsumerDto
import com.example.smartsolarmobile.data.api.models.ProsumerRegistrationRequest
import com.example.smartsolarmobile.data.api.models.UserRole
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.local.TokenManager
import org.json.JSONObject
import java.nio.charset.StandardCharsets

class AuthRepository(
    private val apiService: ApiService = RetrofitClient.apiService,
    private val tokenManager: TokenManager
) {

    init {
        RetrofitClient.setTokenProvider { tokenManager.getToken() }
    }

    /**
     * Authenticates user via API (/api/auth/login)
     */
    suspend fun login(userName: String, password: String, expectedRole: UserRole): Result<UserSession> {
        return try {
            val response = apiService.login(LoginRequest(userName, password))
            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!
                if (apiResponse.status && !apiResponse.data.isNullOrEmpty()) {
                    val token = apiResponse.data
                    val claims = parseJwtClaims(token)

                    val roleName = claims.optString("roleName", "User")
                    val parsedRole = mapRoleNameToUserRole(roleName)

                    val usernameFromToken = claims.optString("userName", userName)

                    val session = UserSession(
                        token = token,
                        username = usernameFromToken,
                        userRole = parsedRole,
                        roleName = roleName,
                        nic = if (parsedRole == UserRole.PROSUMER) usernameFromToken else null
                    )

                    tokenManager.saveSession(
                        token = token,
                        username = usernameFromToken,
                        userRole = parsedRole,
                        roleName = roleName,
                        nic = session.nic
                    )

                    Result.success(session)
                } else {
                    Result.failure(Exception(apiResponse.message ?: "Authentication failed."))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Login failed with status code ${response.code()}"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Registers a new Prosumer account
     */
    suspend fun registerProsumer(
        nic: String,
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        phoneNumber: String,
        address: String
    ): Result<ProsumerDto> {
        return try {
            val request = ProsumerRegistrationRequest(
                nic = nic.trim(),
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                email = email.trim(),
                password = password,
                phoneNumber = phoneNumber.trim(),
                address = address.trim()
            )

            val response = apiService.registerProsumer(request)
            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!
                if (apiResponse.status && apiResponse.data != null) {
                    Result.success(apiResponse.data)
                } else {
                    Result.failure(Exception(apiResponse.message ?: "Registration failed."))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Registration failed (${response.code()})"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        tokenManager.clearSession()
    }

    fun getSavedSession(): UserSession? = tokenManager.getSession()

    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    /**
     * Utility to decode JWT claims without external library dependency
     */
    private fun parseJwtClaims(jwtToken: String): JSONObject {
        return try {
            val parts = jwtToken.split(".")
            if (parts.size >= 2) {
                val payload = String(Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING), StandardCharsets.UTF_8)
                JSONObject(payload)
            } else {
                JSONObject()
            }
        } catch (e: Exception) {
            JSONObject()
        }
    }

    private fun mapRoleNameToUserRole(roleName: String): UserRole {
        return when {
            roleName.contains("Operator", ignoreCase = true) || roleName.contains("Grid", ignoreCase = true) -> UserRole.GRID_OPERATOR
            roleName.contains("Backoffice", ignoreCase = true) || roleName.contains("Admin", ignoreCase = true) -> UserRole.BACKOFFICE
            else -> UserRole.PROSUMER
        }
    }
}
