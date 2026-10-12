package com.example.smartsolarmobile.data.local

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

/** Instant (no-wait) connectivity check, used to skip a live API call entirely and go straight
 *  to the local SQLite fallback when there's clearly no usable network - without this, "offline"
 *  behaviour only kicked in after OkHttp's full connect/read timeout (15s) elapsed for every
 *  single call, which made login and menu loading look broken/frozen while offline. */
class NetworkMonitor(context: Context) {
    private val appContext = context.applicationContext

    fun isOnline(): Boolean {
        val cm = appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return true
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
}
