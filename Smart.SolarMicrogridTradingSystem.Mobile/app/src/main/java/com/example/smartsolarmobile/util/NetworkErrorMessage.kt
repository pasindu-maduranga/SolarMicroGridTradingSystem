package com.example.smartsolarmobile.util

import java.io.IOException

/** Shown (with a WiFi-off icon, see AppSnackbarHost) whenever a call fails because of
 *  connectivity rather than a real server-side error - matched by exact text, so keep this
 *  in sync with any comparison against it. */
const val NO_INTERNET_MESSAGE = "No internet connection. Please check your network and try again."

/** Maps a caught exception to text safe to show a user - connectivity failures (timeouts,
 *  unreachable host, etc.) surface as a friendly message instead of a raw exception message
 *  like "Failed to connect to /172.188.240.78:5050". */
fun Throwable.toFriendlyMessage(fallback: String = "Something went wrong. Please try again."): String =
    if (this is IOException) NO_INTERNET_MESSAGE else (message ?: fallback)
