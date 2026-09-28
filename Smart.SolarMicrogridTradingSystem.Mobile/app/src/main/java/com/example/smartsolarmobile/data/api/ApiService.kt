package com.example.smartsolarmobile.data.api

import com.example.smartsolarmobile.data.api.models.ApiResponse
import com.example.smartsolarmobile.data.api.models.LoginRequest
import com.example.smartsolarmobile.data.api.models.ProsumerDto
import com.example.smartsolarmobile.data.api.models.ProsumerRegistrationRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

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
}
