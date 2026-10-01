package com.example.smartsolarmobile.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Common API Response envelope returned by the ASP.NET Core API.
 * The backend's ApiResponseFactory serializes this as { statusCode: "Success"|"Error", message, data } —
 * there is no boolean "status" field, so callers must check statusCode == "Success".
 */
data class ApiResponse<T>(
    @SerializedName("statusCode") val statusCode: String,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: T?
) {
    val isSuccess: Boolean get() = statusCode == "Success"
}

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
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("createdBy") val createdBy: String = "MobileApp"
)

data class UpdateProsumerRequest(
    @SerializedName("firstName") val firstName: String,
    @SerializedName("lastName") val lastName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("address") val address: String,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("modifiedBy") val modifiedBy: String? = null
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
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("profilePictureUrl") val profilePictureUrl: String? = null,
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
    val roleId: String = "",
    val userId: String = "",
    val fullName: String = "",
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
