package com.example.smartsolarmobile.data.api.models

import com.google.gson.annotations.SerializedName

data class NodeSlotDto(
    @SerializedName("slotNumber") val slotNumber: Int,
    @SerializedName("capacity") val capacity: Double,
    @SerializedName("isAvailable") val isAvailable: Boolean,
    // A slot's capacity is a shared pool per calendar date, not a single exclusive claim - this
    // is only today's snapshot (no date parameter on this endpoint); the server is the final
    // authority for whatever date the Prosumer actually picks when they submit a reservation.
    @SerializedName("remainingCapacity") val remainingCapacity: Double = capacity,
    @SerializedName("unitPricePerKwh") val unitPricePerKwh: Double
)

data class NodeDto(
    @SerializedName("nodeID") val nodeId: String,
    @SerializedName("name") val name: String,
    @SerializedName("address") val address: String?,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("capacity") val capacity: Double,
    @SerializedName("numberOfSlots") val numberOfSlots: Int,
    @SerializedName("availableSlotsCount") val availableSlotsCount: Int,
    @SerializedName("availableCapacity") val availableCapacity: Double,
    @SerializedName("slots") val slots: List<NodeSlotDto>,
    @SerializedName("openingTime") val openingTime: String?,
    @SerializedName("closingTime") val closingTime: String?,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("assignedGridOperatorUserId") val assignedGridOperatorUserId: String?,
    @SerializedName("assignedGridOperatorName") val assignedGridOperatorName: String?
)

data class CreateReservationRequest(
    @SerializedName("nodeId") val nodeId: String,
    @SerializedName("slotNumber") val slotNumber: Int,
    @SerializedName("prosumerNic") val prosumerNic: String,
    @SerializedName("scheduledDate") val scheduledDate: String
)

data class UpdateReservationRequest(
    @SerializedName("prosumerNic") val prosumerNic: String,
    @SerializedName("newSlotNumber") val newSlotNumber: Int?,
    @SerializedName("newScheduledDate") val newScheduledDate: String
)

data class VerifyReservationRequest(
    @SerializedName("qrToken") val qrToken: String,
    @SerializedName("verifiedBy") val verifiedBy: String?,
    @SerializedName("energyDeliveredKwh") val energyDeliveredKwh: Double
)

data class CancelReservationRequest(
    @SerializedName("prosumerNic") val prosumerNic: String
)

data class ReservationDto(
    @SerializedName("reservationId") val reservationId: String,
    @SerializedName("nodeID") val nodeId: String,
    @SerializedName("nodeName") val nodeName: String,
    @SerializedName("slotNumber") val slotNumber: Int,
    @SerializedName("slotCapacity") val slotCapacity: Double,
    @SerializedName("unitPricePerKwh") val unitPricePerKwh: Double,
    @SerializedName("scheduledDate") val scheduledDate: String?,
    @SerializedName("energyDeliveredKwh") val energyDeliveredKwh: Double?,
    @SerializedName("amountEarned") val amountEarned: Double?,
    @SerializedName("prosumerNic") val prosumerNic: String,
    @SerializedName("prosumerName") val prosumerName: String,
    @SerializedName("qrToken") val qrToken: String,
    @SerializedName("status") val status: String,
    @SerializedName("reservedDate") val reservedDate: String,
    @SerializedName("completedDate") val completedDate: String?,
    @SerializedName("cancelledDate") val cancelledDate: String?
)

data class PermissionCodeDto(
    @SerializedName("permissionCode") val permissionCode: String
)
