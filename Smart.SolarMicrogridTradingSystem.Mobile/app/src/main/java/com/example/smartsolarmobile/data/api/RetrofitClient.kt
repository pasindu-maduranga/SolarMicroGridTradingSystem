package com.example.smartsolarmobile.data.api

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {


    private var baseUrl: String = "http://172.188.240.78:5050/"
    private var tokenProvider: (() -> String?)? = null

    fun setBaseUrl(url: String) {
        val formattedUrl = if (url.endsWith("/")) url else "$url/"
        baseUrl = formattedUrl
        retrofit = createRetrofit()
    }

    fun setTokenProvider(provider: () -> String?) {
        tokenProvider = provider
    }

    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        val token = tokenProvider?.invoke()

        val requestBuilder = originalRequest.newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        chain.proceed(requestBuilder.build())
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        // Short timeouts matter here: NetworkMonitor's pre-check can't always tell "online" from
        // "device thinks it's online but the server is actually unreachable" (e.g. some emulator
        // network configs), so a slow/absent connection still has to fail fast enough for the
        // offline SQLite fallback to feel instant rather than making the screen look frozen.
        .connectTimeout(6, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    private fun createRetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    private var retrofit: Retrofit = createRetrofit()

    val apiService: ApiService
        get() = retrofit.create(ApiService::class.java)
}
