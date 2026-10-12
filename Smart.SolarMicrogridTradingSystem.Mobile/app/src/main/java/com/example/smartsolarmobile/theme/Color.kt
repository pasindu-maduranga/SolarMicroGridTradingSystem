package com.example.smartsolarmobile.theme

import androidx.compose.ui.graphics.Color

// Brand palette — matches the SolarGrid web app (Tailwind "sg-*" tokens) so the
// mobile app and the Backoffice/Grid Operator web portal look like one product.
val SgPanelDark = Color(0xFF1D4A30)   // sg-panel-1
val SgPanel = Color(0xFF2F6B45)       // sg-panel-2 (primary brand green)
val SgSun = Color(0xFFE8A53A)         // sg-sun (Prosumer accent)
val SgSunSoft = Color(0xFFF0C580)     // sg-sun-soft
val SgSky = Color(0xFF7FB8D8)         // sg-sky
val SgInk = Color(0xFF22201A)         // sg-ink (primary text)
val SgInkSoft = Color(0xFF726A58)     // sg-ink-soft (muted text)
val SgFieldBg = Color(0xFFF4F1E8)     // sg-field-bg (input background)
val SgLine = Color(0xFFE6DDC4)        // sg-line (borders)
val SgError = Color(0xFFC0392B)
val SgErrorBg = Color(0xFFFBE9E7)
val SgCream = Color(0xFFFBF8EF)

// Legacy aliases kept for any existing references
val SolarAmber = SgSun
val SolarAmberLight = SgSunSoft
val SolarAmberDark = Color(0xFFD97706)

val EcoGreenPrimary = SgPanel
val EcoGreenLight = Color(0xFF3F8A5C)
val EcoGreenDark = SgPanelDark

val TechBlue = SgSky
val DarkSlate = Color(0xFF15291D)
val SurfaceLight = SgCream
val CardBorderLight = SgLine

val TextPrimary = SgInk
val TextSecondary = SgInkSoft
val ErrorRed = SgError
