package com.example.smartsolarmobile.data.repository

import com.example.smartsolarmobile.data.api.ApiService
import com.example.smartsolarmobile.data.api.RetrofitClient
import com.example.smartsolarmobile.data.api.models.CancelReservationRequest
import com.example.smartsolarmobile.data.api.models.CreateReservationRequest
import com.example.smartsolarmobile.data.api.models.NodeDto
import com.example.smartsolarmobile.data.api.models.ReservationDto
import com.example.smartsolarmobile.data.api.models.UpdateReservationRequest
import com.example.smartsolarmobile.data.api.models.VerifyReservationRequest
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
    private val apiService: ApiService = RetrofitClient.apiService
) {
    /** True if the given role has VIEW (or ADD/EDIT) access to screenCode, per the same
     *  Role Permission data the web Backoffice manages. Fails open to false on any error. */
    suspend fun hasAccess(roleId: String, screenCode: String): Boolean {
        return try {
            val response = apiService.getPermissionsByRoleAndScreen(roleId, screenCode)
            val codes = response.body()?.data.orEmpty()
            codes.any { it.permissionCode == "VIEW$screenCode" || it.permissionCode == "ADDEDIT$screenCode" }
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getAllNodes(): Result<List<NodeDto>> {
        return try {
            val response = apiService.getAllNodes()
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                Result.success(body.data.orEmpty())
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load nodes."))
            }
        } catch (e: Exception) {
            Result.failure(e)
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

    suspend fun getMyReservations(nic: String): Result<List<ReservationDto>> {
        return try {
            val response = apiService.getMyReservations(nic)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                Result.success(body.data.orEmpty())
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load reservations."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getReservationsByNode(nodeId: String): Result<List<ReservationDto>> {
        return try {
            val response = apiService.getReservationsByNode(nodeId)
            val body = response.body()
            if (response.isSuccessful && body?.isSuccess == true) {
                Result.success(body.data.orEmpty())
            } else {
                Result.failure(Exception(body?.message ?: "Failed to load bookings."))
            }
        } catch (e: Exception) {
            Result.failure(e)
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
