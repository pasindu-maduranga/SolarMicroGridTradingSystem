package com.example.smartsolarmobile.data.api

import com.example.smartsolarmobile.data.api.models.ApiResponse
import com.example.smartsolarmobile.data.api.models.CancelReservationRequest
import com.example.smartsolarmobile.data.api.models.CreateReservationRequest
import com.example.smartsolarmobile.data.api.models.LoginRequest
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.api.models.PermissionCodeDto
import com.example.smartsolarmobile.data.api.models.ProsumerDto
import com.example.smartsolarmobile.data.api.models.ProsumerRegistrationRequest
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.api.models.UpdateReservationRequest
import com.example.smartsolarmobile.data.api.models.VerifyReservationRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import com.example.smartsolarmobile.data.api.models.UpdateProsumerRequest

interface ApiService {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<ApiResponse<String>>

    @POST("api/prosumer")
    suspend fun registerProsumer(
        @Body request: ProsumerRegistrationRequest
    ): Response<ApiResponse<ProsumerDto>>

    @GET("api/prosumer/{nic}")
    suspend fun getProsumerByNic(
        @Path("nic") nic: String
    ): Response<ApiResponse<ProsumerDto>>

    @PUT("api/prosumer/{nic}")
    suspend fun updateProsumer(
        @Path("nic") nic: String,
        @Body request: UpdateProsumerRequest
    ): Response<ApiResponse<ProsumerDto>>

    @GET("api/permission/GetPermissionsByRoleAndScreen")
    suspend fun getPermissionsByRoleAndScreen(
        @Query("roleID") roleId: String,
        @Query("screenCode") screenCode: String
    ): Response<ApiResponse<List<PermissionCodeDto>>>

    @GET("api/node")
    suspend fun getAllNodes(): Response<ApiResponse<List<NodeDto>>>

    @POST("api/reservation")
    suspend fun createReservation(
        @Body request: CreateReservationRequest
    ): Response<ApiResponse<ReservationDto>>

    @GET("api/reservation/mine/{nic}")
    suspend fun getMyReservations(
        @Path("nic") nic: String
    ): Response<ApiResponse<List<ReservationDto>>>

    @GET("api/reservation/byNode/{nodeId}")
    suspend fun getReservationsByNode(
        @Path("nodeId") nodeId: String
    ): Response<ApiResponse<List<ReservationDto>>>

    @POST("api/reservation/verify")
    suspend fun verifyReservation(
        @Body request: VerifyReservationRequest
    ): Response<ApiResponse<ReservationDto>>

    @PUT("api/reservation/{id}")
    suspend fun updateReservation(
        @Path("id") id: String,
        @Body request: UpdateReservationRequest
    ): Response<ApiResponse<ReservationDto>>

    @PUT("api/reservation/{id}/cancel")
    suspend fun cancelReservation(
        @Path("id") id: String,
        @Body request: CancelReservationRequest
    ): Response<ApiResponse<ReservationDto>>
}
