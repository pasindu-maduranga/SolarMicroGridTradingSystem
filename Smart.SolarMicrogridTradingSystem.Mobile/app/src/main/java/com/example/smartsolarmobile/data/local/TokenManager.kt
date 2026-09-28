package com.example.smartsolarmobile.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.smartsolarmobile.data.api.models.UserRole
import com.example.smartsolarmobile.data.api.models.UserSession

class TokenManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "smart_solar_auth_prefs"
        private const val KEY_JWT_TOKEN = "jwt_token"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_ROLE_NAME = "role_name"
        private const val KEY_USERNAME = "username"
        private const val KEY_USER_NIC = "user_nic"
        private const val KEY_FULL_NAME = "full_name"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
    }

    fun saveSession(
        token: String,
        username: String,
        userRole: UserRole,
        roleName: String,
        nic: String? = null,
        fullName: String? = null
    ) {
        prefs.edit().apply {
            putString(KEY_JWT_TOKEN, token)
            putString(KEY_USERNAME, username)
            putString(KEY_USER_ROLE, userRole.name)
            putString(KEY_ROLE_NAME, roleName)
            putString(KEY_USER_NIC, nic)
            putString(KEY_FULL_NAME, fullName)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getToken(): String? = prefs.getString(KEY_JWT_TOKEN, null)

    fun getUserRole(): UserRole {
        val roleStr = prefs.getString(KEY_USER_ROLE, UserRole.PROSUMER.name)
        return try {
            UserRole.valueOf(roleStr ?: UserRole.PROSUMER.name)
        } catch (e: Exception) {
            UserRole.PROSUMER
        }
    }

    fun getRoleName(): String = prefs.getString(KEY_ROLE_NAME, "User") ?: "User"

    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)

    fun getUserNic(): String? = prefs.getString(KEY_USER_NIC, null)

    fun getFullName(): String? = prefs.getString(KEY_FULL_NAME, null)

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false) && !getToken().isNullOrEmpty()

    fun getSession(): UserSession? {
        if (!isLoggedIn()) return null
        val token = getToken() ?: return null
        val username = getUsername() ?: return null
        val role = getUserRole()
        val roleName = getRoleName()
        val nic = getUserNic()

        return UserSession(
            token = token,
            username = username,
            userRole = role,
            roleName = roleName,
            nic = nic
        )
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
