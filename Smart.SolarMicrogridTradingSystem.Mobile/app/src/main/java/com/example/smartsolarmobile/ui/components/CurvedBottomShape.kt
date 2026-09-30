package com.example.smartsolarmobile.ui.components

import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection

/** A hero-panel bottom edge with a single smooth curve dipping down toward the right,
 *  matching the diagonal split used on the web app's sign-in page. */
class CurvedBottomShape : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
        val path = Path().apply {
            val curveHeight = size.height * 0.12f
            lineTo(0f, size.height - curveHeight)
            quadraticBezierTo(
                size.width * 0.5f, size.height + curveHeight,
                size.width, size.height - curveHeight
            )
            lineTo(size.width, 0f)
            close()
        }
        return Outline.Generic(path)
    }
}
