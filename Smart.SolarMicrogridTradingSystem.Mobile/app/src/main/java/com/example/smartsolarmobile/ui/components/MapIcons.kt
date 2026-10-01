package com.example.smartsolarmobile.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory

/** Google Maps markers need a Bitmap, not a vector drawable resource directly (fromResource()
 *  is unreliable with VectorDrawables on older API levels) - this rasterizes one at an explicit
 *  pixel size so it stays crisp as a small map pin.
 *
 *  BitmapDescriptorFactory crashes with "IBitmapDescriptorFactory is not initialized" if called
 *  before any GoogleMap composable has been mounted (which is what actually initializes it
 *  internally) - explicitly initializing it here makes this safe to call from `remember {}`
 *  ahead of the GoogleMap composable's own composition, not just after. */
fun vectorToBitmapDescriptor(context: Context, @DrawableRes drawableResId: Int, sizePx: Int = 96): BitmapDescriptor {
    try {
        MapsInitializer.initialize(context.applicationContext)
    } catch (e: Exception) {
        // Already initialized, or Play Services unavailable - fromBitmap() below will fail the
        // same way it always would in that case.
    }

    val drawable = ContextCompat.getDrawable(context, drawableResId)
        ?: return BitmapDescriptorFactory.defaultMarker()
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, sizePx, sizePx)
    drawable.draw(canvas)
    return BitmapDescriptorFactory.fromBitmap(bitmap)
}
