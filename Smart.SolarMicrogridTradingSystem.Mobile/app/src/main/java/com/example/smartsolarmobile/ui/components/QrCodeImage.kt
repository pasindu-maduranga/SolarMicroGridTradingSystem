package com.example.smartsolarmobile.ui.components

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter

/** Renders [content] as a black-on-white QR code bitmap. */
@Composable
fun QrCodeImage(content: String, modifier: Modifier = Modifier, sizeDp: Int = 220) {
    val bitmap = remember(content) { generateQrBitmap(content, 512) }
    Image(
        bitmap = bitmap.asImageBitmap(),
        contentDescription = "QR code",
        modifier = modifier.size(sizeDp.dp)
    )
}

private fun generateQrBitmap(content: String, sizePx: Int): Bitmap {
    val bitMatrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx)
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.RGB_565)
    for (x in 0 until sizePx) {
        for (y in 0 until sizePx) {
            bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
        }
    }
    return bitmap
}
