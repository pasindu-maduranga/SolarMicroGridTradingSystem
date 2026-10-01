package com.example.smartsolarmobile.data.repository

import android.util.Base64
import com.example.smartsolarmobile.data.api.ApiService
import com.example.smartsolarmobile.data.api.RetrofitClient
import com.example.smartsolarmobile.data.api.models.LoginRequest
import com.example.smartsolarmobile.data.api.models.ProsumerDto
import com.example.smartsolarmobile.data.api.models.ProsumerRegistrationRequest
import com.example.smartsolarmobile.data.api.models.UpdateProsumerRequest
import com.example.smartsolarmobile.data.api.models.UserRole
import com.example.smartsolarmobile.data.api.models.UserSession
import com.example.smartsolarmobile.data.local.LocalUserDatabase
import com.example.smartsolarmobile.data.local.NetworkMonitor
import com.example.smartsolarmobile.data.local.TokenManager
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.nio.charset.StandardCharsets

class AuthRepository(
    private val apiService: ApiService = RetrofitClient.apiService,
    private val tokenManager: TokenManager,
    private val localUserDatabase: LocalUserDatabase? = null,
    private val networkMonitor: NetworkMonitor? = null
) {

    companion object {
        // Sentinel session token for an offline-verified login (see loginOffline) - not a real
        // JWT, so any API call made with it correctly fails until the device is back online.
        private const val OFFLINE_TOKEN = "OFFLINE_SESSION"
    }

    init {
        RetrofitClient.setTokenProvider { tokenManager.getToken() }
    }

    /**
     * Authenticates user via API (/api/auth/login)
     */
    suspend fun login(userName: String, password: String): Result<UserSession> {
        if (networkMonitor?.isOnline() == false) {
            return loginOffline(userName, password)
        }
        return try {
            val response = apiService.login(LoginRequest(userName, password))
            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!
                if (apiResponse.isSuccess && !apiResponse.data.isNullOrEmpty()) {
                    val token = apiResponse.data
                    val claims = parseJwtClaims(token)

                    val roleName = claims.optString("roleName", "User")
                    val parsedRole = mapRoleNameToUserRole(roleName)
                    val roleId = claims.optString("roleID", "")
                    val userId = claims.optString("nameid", "")
                    val fullName = claims.optString("fullName", "")

                    val usernameFromToken = claims.optString("userName", userName)

                    val session = UserSession(
                        token = token,
                        username = usernameFromToken,
                        userRole = parsedRole,
                        roleName = roleName,
                        roleId = roleId,
                        userId = userId,
                        fullName = fullName,
                        nic = if (parsedRole == UserRole.PROSUMER) usernameFromToken else null
                    )

                    tokenManager.saveSession(
                        token = token,
                        username = usernameFromToken,
                        userRole = parsedRole,
                        roleName = roleName,
                        roleId = roleId,
                        userId = userId,
                        fullName = fullName,
                        nic = session.nic
                    )

                    // Local SQLite copy of the signed-in user, including a salted hash of the
                    // password - lets this same (username, password) sign in again later even
                    // with no connectivity (see the IOException branch below). Off the main
                    // thread since SQLiteOpenHelper's disk I/O is synchronous.
                    withContext(Dispatchers.IO) {
                        localUserDatabase?.saveUser(
                            username = usernameFromToken,
                            fullName = fullName,
                            roleId = roleId,
                            roleName = roleName,
                            userId = userId,
                            nic = session.nic,
                            password = password
                        )
                    }

                    Result.success(session)
                } else {
                    Result.failure(Exception(apiResponse.message ?: "Authentication failed."))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Login failed with status code ${response.code()}"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: java.io.IOException) {
            // No connectivity / server unreachable (as opposed to a real 4xx/5xx response, which
            // is handled above, not thrown) - fall back to verifying against this device's cached
            // credentials from a previous successful online login.
            loginOffline(userName, password)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /** Verifies (username, password) against this device's cached hash from a previous online
     *  login and, on a match, restores that session locally so the app opens with cached menus/
     *  permissions - no live API token is obtained, so anything requiring a real network call
     *  still fails until connectivity returns. */
    private suspend fun loginOffline(userName: String, password: String): Result<UserSession> {
        val cached = withContext(Dispatchers.IO) {
            localUserDatabase?.verifyPassword(userName.trim(), password)
        } ?: return Result.failure(
            Exception("You're offline and this account hasn't signed in on this device before. Connect to the internet once to enable offline sign-in.")
        )

        val role = mapRoleNameToUserRole(cached.roleName)
        val session = UserSession(
            token = OFFLINE_TOKEN,
            username = cached.username,
            userRole = role,
            roleName = cached.roleName,
            roleId = cached.roleId,
            userId = cached.userId,
            fullName = cached.fullName,
            nic = cached.nic
        )
        tokenManager.saveSession(
            token = OFFLINE_TOKEN,
            username = cached.username,
            userRole = role,
            roleName = cached.roleName,
            roleId = cached.roleId,
            userId = cached.userId,
            fullName = cached.fullName,
            nic = cached.nic
        )
        return Result.success(session)
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
        address: String,
        latitude: Double,
        longitude: Double
    ): Result<ProsumerDto> {
        return try {
            val request = ProsumerRegistrationRequest(
                nic = nic.trim(),
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                email = email.trim(),
                password = password,
                phoneNumber = phoneNumber.trim(),
                address = address.trim(),
                latitude = latitude,
                longitude = longitude
            )

            val response = apiService.registerProsumer(request)
            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!
                if (apiResponse.isSuccess && apiResponse.data != null) {
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

    /** Fetches the current profile fields for editing (Prosumer Account Control). Caches the
     *  result so the profile can still be viewed (read-only in effect - saving still needs
     *  connectivity) if this call fails while offline. */
    suspend fun getProsumerByNic(nic: String): Result<ProsumerDto> {
        if (networkMonitor?.isOnline() == false) {
            return cachedProsumerProfileOrFailure(nic)
        }
        return try {
            val response = apiService.getProsumerByNic(nic)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                withContext(Dispatchers.IO) {
                    localUserDatabase?.cacheProsumerProfile(nic, Gson().toJson(body.data))
                }
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Could not load your profile."))
            }
        } catch (e: Exception) {
            cachedProsumerProfileOrFailure(nic, e)
        }
    }

    private suspend fun cachedProsumerProfileOrFailure(nic: String, originalError: Exception? = null): Result<ProsumerDto> {
        val cachedJson = withContext(Dispatchers.IO) { localUserDatabase?.getCachedProsumerProfile(nic) }
        val cachedProfile = cachedJson?.let {
            try { Gson().fromJson(it, ProsumerDto::class.java) } catch (parseError: Exception) { null }
        }
        return if (cachedProfile != null) {
            Result.success(cachedProfile)
        } else {
            Result.failure(originalError ?: Exception("You're offline and this profile hasn't been loaded on this device before."))
        }
    }

    /** Edits profile fields, or (isActive = false) self-requests deactivation - reactivation is
     *  Backoffice-only, enforced server-side. */
    suspend fun updateProsumerProfile(
        nic: String,
        firstName: String,
        lastName: String,
        email: String,
        phoneNumber: String,
        address: String,
        isActive: Boolean,
        latitude: Double? = null,
        longitude: Double? = null
    ): Result<ProsumerDto> {
        if (networkMonitor?.isOnline() == false) {
            return Result.failure(Exception("You're offline - editing your profile needs an internet connection."))
        }
        return try {
            val request = UpdateProsumerRequest(
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                email = email.trim(),
                phoneNumber = phoneNumber.trim(),
                address = address.trim(),
                latitude = latitude,
                longitude = longitude,
                isActive = isActive,
                modifiedBy = nic
            )
            val response = apiService.updateProsumer(nic, request)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                withContext(Dispatchers.IO) {
                    localUserDatabase?.cacheProsumerProfile(nic, Gson().toJson(body.data))
                }
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Could not update your profile."))
            }
        } catch (e: java.io.IOException) {
            // Saving mutates server state, so unlike viewing there's no meaningful offline path -
            // give a clear reason instead of a generic network error message.
            Result.failure(Exception("You're offline - editing your profile needs an internet connection."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        // Only the active session (TokenManager) is cleared here - the cached credential hash in
        // LocalUserDatabase deliberately survives sign-out, otherwise this account could never
        // sign in offline again after logging out once.
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
