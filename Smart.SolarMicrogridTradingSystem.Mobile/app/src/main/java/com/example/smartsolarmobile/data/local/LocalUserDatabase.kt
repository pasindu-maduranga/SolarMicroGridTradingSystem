package com.example.smartsolarmobile.data.local

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

data class CachedUser(
    val username: String,
    val fullName: String,
    val roleId: String,
    val roleName: String,
    val userId: String,
    val nic: String?
)


class LocalUserDatabase(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "smart_solar_local.db"
        private const val DATABASE_VERSION = 4

        private const val TABLE_USER = "local_user"
        private const val TABLE_PERMISSIONS = "permission_cache"
        private const val TABLE_DATA_CACHE = "data_cache"
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_USER (
                username TEXT PRIMARY KEY,
                fullName TEXT NOT NULL,
                roleId TEXT NOT NULL,
                roleName TEXT NOT NULL,
                userId TEXT NOT NULL,
                nic TEXT,
                passwordHash TEXT,
                passwordSalt TEXT,
                prosumerJson TEXT,
                updatedAt INTEGER NOT NULL
            )
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE $TABLE_PERMISSIONS (
                roleId TEXT NOT NULL,
                screenCode TEXT NOT NULL,
                permissionCode TEXT NOT NULL,
                PRIMARY KEY (roleId, screenCode, permissionCode)
            )
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE $TABLE_DATA_CACHE (
                cacheKey TEXT PRIMARY KEY,
                json TEXT NOT NULL,
                updatedAt INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            db.execSQL("ALTER TABLE $TABLE_USER ADD COLUMN passwordHash TEXT")
            db.execSQL("ALTER TABLE $TABLE_USER ADD COLUMN passwordSalt TEXT")
        }
        if (oldVersion < 3) {
            db.execSQL("ALTER TABLE $TABLE_USER ADD COLUMN prosumerJson TEXT")
        }
        if (oldVersion < 4) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS $TABLE_DATA_CACHE (
                    cacheKey TEXT PRIMARY KEY,
                    json TEXT NOT NULL,
                    updatedAt INTEGER NOT NULL
                )
                """.trimIndent()
            )
        }
    }

    /** Saves/replaces the local copy of the signed-in user, including a salted hash (never the
     *  plaintext) of their password - called right after a successful ONLINE login, so the same
     *  credentials can later be verified locally by [verifyPassword] if the device is offline the
     *  next time this user tries to sign in. This row deliberately survives sign-out (only the
     *  active session in TokenManager is cleared then), otherwise offline sign-in could never work
     *  for a user who has ever logged out. */
    fun saveUser(username: String, fullName: String, roleId: String, roleName: String, userId: String, nic: String?, password: String) {
        val salt = PasswordHasher.generateSalt()
        val values = ContentValues().apply {
            put("username", username)
            put("fullName", fullName)
            put("roleId", roleId)
            put("roleName", roleName)
            put("userId", userId)
            put("nic", nic)
            put("passwordHash", PasswordHasher.hash(password, salt))
            put("passwordSalt", salt)
            put("updatedAt", System.currentTimeMillis())
        }
        writableDatabase.insertWithOnConflict(TABLE_USER, null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    /** Returns the most recently saved local user, if any. */
    fun getCachedUser(): CachedUser? {
        readableDatabase.query(
            TABLE_USER, null, null, null, null, null, "updatedAt DESC", "1"
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return CachedUser(
                username = cursor.getString(cursor.getColumnIndexOrThrow("username")),
                fullName = cursor.getString(cursor.getColumnIndexOrThrow("fullName")),
                roleId = cursor.getString(cursor.getColumnIndexOrThrow("roleId")),
                roleName = cursor.getString(cursor.getColumnIndexOrThrow("roleName")),
                userId = cursor.getString(cursor.getColumnIndexOrThrow("userId")),
                nic = cursor.getString(cursor.getColumnIndexOrThrow("nic"))
            )
        }
    }

    /** Verifies (username, password) against the locally-cached hash from this user's last
     *  successful online login - used as a fallback so sign-in still works with no connectivity.
     *  Returns null if this device has never seen this username, or the password doesn't match. */
    fun verifyPassword(username: String, password: String): CachedUser? {
        readableDatabase.query(
            TABLE_USER, null, "username = ?", arrayOf(username), null, null, null
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            val storedHash = cursor.getString(cursor.getColumnIndexOrThrow("passwordHash")) ?: return null
            val storedSalt = cursor.getString(cursor.getColumnIndexOrThrow("passwordSalt")) ?: return null
            if (PasswordHasher.hash(password, storedSalt) != storedHash) return null
            return CachedUser(
                username = cursor.getString(cursor.getColumnIndexOrThrow("username")),
                fullName = cursor.getString(cursor.getColumnIndexOrThrow("fullName")),
                roleId = cursor.getString(cursor.getColumnIndexOrThrow("roleId")),
                roleName = cursor.getString(cursor.getColumnIndexOrThrow("roleName")),
                userId = cursor.getString(cursor.getColumnIndexOrThrow("userId")),
                nic = cursor.getString(cursor.getColumnIndexOrThrow("nic"))
            )
        }
    }

    /** Caches the full Prosumer profile (as JSON) for offline viewing of Edit Profile - keyed by
     *  username, which is the same value as the prosumer's NIC. Saving edits still requires
     *  connectivity; this only lets the screen show the last-known data while offline. */
    fun cacheProsumerProfile(username: String, json: String) {
        val values = ContentValues().apply { put("prosumerJson", json) }
        writableDatabase.update(TABLE_USER, values, "username = ?", arrayOf(username))
    }

    fun getCachedProsumerProfile(username: String): String? {
        readableDatabase.query(
            TABLE_USER, arrayOf("prosumerJson"), "username = ?", arrayOf(username), null, null, null
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return cursor.getString(cursor.getColumnIndexOrThrow("prosumerJson"))
        }
    }

    /** Generic JSON cache for list-type data (nodes, reservations, etc.) - keyed by a caller-chosen
     *  string, e.g. "myReservations:{nic}" or "nodesByOperator:{nodeId}". Used so list screens can
     *  still show the last-known data (read-only in effect) when there's no connectivity, the same
     *  way [cacheProsumerProfile] does for the profile screen. */
    fun cacheJson(key: String, json: String) {
        val values = ContentValues().apply {
            put("cacheKey", key)
            put("json", json)
            put("updatedAt", System.currentTimeMillis())
        }
        writableDatabase.insertWithOnConflict(TABLE_DATA_CACHE, null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun getCachedJson(key: String): String? {
        readableDatabase.query(
            TABLE_DATA_CACHE, arrayOf("json"), "cacheKey = ?", arrayOf(key), null, null, null
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return cursor.getString(cursor.getColumnIndexOrThrow("json"))
        }
    }

    /** Replaces the cached permission codes for one (role, screen) pair - called every time a
     *  live permission check succeeds, so there's always a reasonably fresh fallback available. */
    fun cachePermissions(roleId: String, screenCode: String, permissionCodes: List<String>) {
        val db = writableDatabase
        db.delete(TABLE_PERMISSIONS, "roleId = ? AND screenCode = ?", arrayOf(roleId, screenCode))
        permissionCodes.forEach { code ->
            val values = ContentValues().apply {
                put("roleId", roleId)
                put("screenCode", screenCode)
                put("permissionCode", code)
            }
            db.insertWithOnConflict(TABLE_PERMISSIONS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        }
    }

    /** Reads back the last-cached permission codes for one (role, screen) pair - used only as a
     *  fallback when the live server call fails (e.g. no internet connection). */
    fun getCachedPermissionCodes(roleId: String, screenCode: String): List<String> {
        val codes = mutableListOf<String>()
        readableDatabase.query(
            TABLE_PERMISSIONS,
            arrayOf("permissionCode"),
            "roleId = ? AND screenCode = ?",
            arrayOf(roleId, screenCode),
            null, null, null
        ).use { cursor ->
            while (cursor.moveToNext()) {
                codes.add(cursor.getString(cursor.getColumnIndexOrThrow("permissionCode")))
            }
        }
        return codes
    }
}
