package com.example.smartsolarmobile.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Common API Response envelope returned by the ASP.NET Core API
 */
data class ApiResponse<T>(
    @SerializedName("status") val status: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: T?
)

/**
 * Login request payload for /api/auth/login
 */
data class LoginRequest(
    @SerializedName("userName") val userName: String,
    @SerializedName("password") val password: String
)

/**
 * Prosumer Registration payload for POST /api/prosumer
 */
data class ProsumerRegistrationRequest(
    @SerializedName("nic") val nic: String,
    @SerializedName("firstName") val firstName: String,
    @SerializedName("lastName") val lastName: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("address") val address: String,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("createdBy") val createdBy: String = "MobileApp"
)

/**
 * Prosumer summary DTO returned by API
 */
data class ProsumerDto(
    @SerializedName("nic") val nic: String,
    @SerializedName("firstName") val firstName: String,
    @SerializedName("lastName") val lastName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("address") val address: String,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("createdDate") val createdDate: String?
)

/**
 * Decoded JWT token user details
 */
data class UserSession(
    val token: String,
    val username: String,
    val userRole: UserRole,
    val roleName: String,
    val nic: String? = null
)

/**
 * Roles supported on the mobile app
 */
enum class UserRole {
    GRID_OPERATOR,
    PROSUMER,
    BACKOFFICE
}
