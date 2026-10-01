package com.example.smartsolarmobile.data.repository

import com.example.smartsolarmobile.data.api.ApiService
import com.example.smartsolarmobile.data.api.RetrofitClient
import com.example.smartsolarmobile.data.local.LocalUserDatabase
import com.example.smartsolarmobile.data.local.NetworkMonitor
import com.example.smartsolarmobile.data.api.models.CancelReservationRequest
import com.example.smartsolarmobile.data.api.models.CreateReservationRequest
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.api.models.UpdateReservationRequest
import com.example.smartsolarmobile.data.api.models.VerifyReservationRequest
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

// SimpleDateFormat isn't thread-safe and is expensive to construct, so each (pattern, timezone)
// gets one cached-per-thread instance instead of a fresh one on every call - these functions run
// once per row of every reservation/transaction list, on every scroll/recomposition, so allocating
// (and exception-driven-parsing, see below) on each call was real, measurable per-frame overhead.
private val formatCache = ThreadLocal.withInitial { mutableMapOf<String, SimpleDateFormat>() }

private fun formatterFor(pattern: String, timeZoneId: String? = "UTC"): SimpleDateFormat {
    val key = "$pattern|$timeZoneId"
    return formatCache.get().getOrPut(key) {
        SimpleDateFormat(pattern, Locale.US).apply {
            if (timeZoneId != null) timeZone = TimeZone.getTimeZone(timeZoneId)
        }
    }
}

/** ISO-8601 UTC formatting via java.text (not java.time, which needs API 26+) so the backend's
 *  DateTime fields parse it directly. */
fun Date.toIsoUtcString(): String = formatterFor("yyyy-MM-dd'T'HH:mm:ss'Z'").format(this)

/** Parses an ISO-8601 UTC string (as returned by the .NET backend) back into a Date, tolerating
 *  both the "...Z" and fractional-seconds ("...ffffffZ") forms Mongo/JSON.NET may emit. Picks the
 *  matching pattern by shape instead of throwing-and-retrying (exceptions are costly, and this
 *  runs once per visible row on every list recomposition). */
fun parseIsoUtc(value: String?): Date? {
    if (value.isNullOrBlank()) return null
    val pattern = when {
        value.length >= 28 -> "yyyy-MM-dd'T'HH:mm:ss.SSSSSSS'Z'"
        value.contains('.') -> "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        else -> "yyyy-MM-dd'T'HH:mm:ss'Z'"
    }
    return try {
        formatterFor(pattern).parse(value)
    } catch (e: Exception) {
        null
    }
}

// Deliberately uses the device's local timezone (timeZoneId = null keeps SimpleDateFormat's
// default), not UTC - this is what's actually shown to the user, unlike the ISO helpers above.
fun Date.toFriendlyString(): String = formatterFor("dd MMM yyyy, hh:mm a", timeZoneId = null).format(this)

class ReservationRepository(
    private val apiService: ApiService = RetrofitClient.apiService,
    private val localUserDatabase: LocalUserDatabase? = null,
    private val networkMonitor: NetworkMonitor? = null
) {
    /** True if the given role has VIEW (or ADD/EDIT) access to screenCode, per the same
     *  Role Permission data the web Backoffice manages. On success, the result is cached locally;
     *  if the live call fails (e.g. no internet), falls back to that cache instead of hiding the
     *  menu outright - so the app keeps working, with slightly-stale data, when offline. */
    suspend fun hasAccess(roleId: String, screenCode: String): Boolean {
        fun matches(codes: List<String>) = codes.any { it == "VIEW$screenCode" || it == "ADDEDIT$screenCode" }
        if (networkMonitor?.isOnline() == false) {
            val cached = withContext(Dispatchers.IO) {
                localUserDatabase?.getCachedPermissionCodes(roleId, screenCode).orEmpty()
            }
            return matches(cached)
        }
        return try {
            val response = apiService.getPermissionsByRoleAndScreen(roleId, screenCode)
            // A non-2xx response (e.g. 401 from an offline-login placeholder token) must be
            // treated the same as no connectivity, not as "server says no permissions" - otherwise
            // it would overwrite a perfectly good cache with an empty list.
            if (!response.isSuccessful) throw java.io.IOException("Permission check failed: HTTP ${response.code()}")
            val codes = response.body()?.data.orEmpty().map { it.permissionCode }
            // SQLiteOpenHelper does disk I/O synchronously - without this, LaunchedEffect
            // (which resumes on Dispatchers.Main) would block the UI thread on every permission check.
            withContext(Dispatchers.IO) { localUserDatabase?.cachePermissions(roleId, screenCode, codes) }
            matches(codes)
        } catch (e: Exception) {
            val cached = withContext(Dispatchers.IO) {
                localUserDatabase?.getCachedPermissionCodes(roleId, screenCode).orEmpty()
            }
            matches(cached)
        }
    }

    /** Fetches every node (used to find "my node" client-side by Grid Operators/Backoffice, and
     *  as the map/list source for Prosumers). Cached so My Node Slots, Operator Bookings and
     *  Transaction History (which all start from this same list) still work offline. */
    suspend fun getAllNodes(): Result<List<NodeDto>> {
        val cacheKey = "all_nodes"
        if (networkMonitor?.isOnline() == false) {
            return cachedListOrFailure(cacheKey, object : TypeToken<List<NodeDto>>() {})
        }
        return try {
            val response = apiService.getAllNodes()
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                val nodes = body.data.orEmpty()
                withContext(Dispatchers.IO) { localUserDatabase?.cacheJson(cacheKey, Gson().toJson(nodes)) }
                Result.success(nodes)
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load nodes."))
            }
        } catch (e: Exception) {
            cachedListOrFailure(cacheKey, object : TypeToken<List<NodeDto>>() {}, e)
        }
    }

    private suspend fun <T> cachedListOrFailure(
        key: String,
        typeToken: TypeToken<List<T>>,
        originalError: Throwable? = null
    ): Result<List<T>> {
        val json = withContext(Dispatchers.IO) { localUserDatabase?.getCachedJson(key) }
        val list: List<T>? = json?.let {
            try { Gson().fromJson<List<T>>(it, typeToken.type) } catch (parseError: Exception) { null }
        }
        return if (list != null) {
            Result.success(list)
        } else {
            Result.failure(originalError ?: Exception("You're offline and this hasn't been loaded on this device before."))
        }
    }

    suspend fun reserveSlot(nodeId: String, slotNumber: Int, prosumerNic: String, scheduledDate: Date): Result<ReservationDto> {
        return try {
            val response = apiService.createReservation(
                CreateReservationRequest(nodeId, slotNumber, prosumerNic, scheduledDate.toIsoUtcString())
            )
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Could not reserve this slot."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateReservation(id: String, prosumerNic: String, newSlotNumber: Int?, newScheduledDate: Date): Result<ReservationDto> {
        return try {
            val response = apiService.updateReservation(
                id, UpdateReservationRequest(prosumerNic, newSlotNumber, newScheduledDate.toIsoUtcString())
            )
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Could not update this reservation."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /** Cached so My Reservations and Earnings (both Prosumer-side, both built from this list)
     *  still show the last-known data offline. */
    suspend fun getMyReservations(nic: String): Result<List<ReservationDto>> {
        val cacheKey = "myReservations:$nic"
        if (networkMonitor?.isOnline() == false) {
            return cachedListOrFailure(cacheKey, object : TypeToken<List<ReservationDto>>() {})
        }
        return try {
            val response = apiService.getMyReservations(nic)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                val list = body.data.orEmpty()
                withContext(Dispatchers.IO) { localUserDatabase?.cacheJson(cacheKey, Gson().toJson(list)) }
                Result.success(list)
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load reservations."))
            }
        } catch (e: Exception) {
            cachedListOrFailure(cacheKey, object : TypeToken<List<ReservationDto>>() {}, e)
        }
    }

    /** Cached so Operator Bookings and Transaction History (both Grid Operator-side, both built
     *  from this list) still show the last-known data offline. */
    suspend fun getReservationsByNode(nodeId: String): Result<List<ReservationDto>> {
        val cacheKey = "reservationsByNode:$nodeId"
        if (networkMonitor?.isOnline() == false) {
            return cachedListOrFailure(cacheKey, object : TypeToken<List<ReservationDto>>() {})
        }
        return try {
            val response = apiService.getReservationsByNode(nodeId)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                val list = body.data.orEmpty()
                withContext(Dispatchers.IO) { localUserDatabase?.cacheJson(cacheKey, Gson().toJson(list)) }
                Result.success(list)
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load bookings."))
            }
        } catch (e: Exception) {
            cachedListOrFailure(cacheKey, object : TypeToken<List<ReservationDto>>() {}, e)
        }
    }

    suspend fun cancelReservation(id: String, prosumerNic: String): Result<ReservationDto> {
        return try {
            val response = apiService.cancelReservation(id, CancelReservationRequest(prosumerNic))
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Could not cancel this reservation."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyReservation(qrToken: String, verifiedBy: String?, energyDeliveredKwh: Double): Result<ReservationDto> {
        return try {
            val response = apiService.verifyReservation(VerifyReservationRequest(qrToken, verifiedBy, energyDeliveredKwh))
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.message ?: "Invalid or already used QR code."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
