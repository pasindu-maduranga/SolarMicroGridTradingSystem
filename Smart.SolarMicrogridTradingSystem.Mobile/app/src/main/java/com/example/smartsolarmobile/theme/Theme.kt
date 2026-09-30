package com.example.smartsolarmobile.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = EcoGreenLight,
    onPrimary = DarkSlate,
    secondary = SolarAmberLight,
    onSecondary = DarkSlate,
    tertiary = TechBlue,
    background = DarkSlate,
    surface = Color(0xFF1E293B),
    onBackground = Color.White,
    onSurface = Color.White,
    error = ErrorRed
)

// Grid Operators share the exact web-portal brand identity (forest green), since
// they use both the web Backoffice app and this mobile app.
private val GridOperatorColorScheme = lightColorScheme(
    primary = SgPanel,
    onPrimary = Color.White,
    secondary = SgSun,
    onSecondary = SgInk,
    tertiary = SgSky,
    background = Color.White,
    surface = Color.White,
    onBackground = SgInk,
    onSurface = SgInk,
    outline = SgLine,
    error = SgError
)

// Prosumers get a distinct, warmer accent (gold/sun tones) built from the same
// palette family, so the app still feels like one product but reads as "consumer".
private val ProsumerColorScheme = lightColorScheme(
    primary = SgSun,
    onPrimary = SgInk,
    secondary = SgPanel,
    onSecondary = Color.White,
    tertiary = SgSky,
    background = Color.White,
    surface = Color.White,
    onBackground = SgInk,
    onSurface = SgInk,
    outline = SgLine,
    error = SgError
)

// Default (pre-login) scheme — the shared brand entry point.
private val LightColorScheme = GridOperatorColorScheme

enum class AppThemeVariant { DEFAULT, GRID_OPERATOR, PROSUMER }

@Composable
fun SmartSolarMobileTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Preserve brand identity
    variant: AppThemeVariant = AppThemeVariant.DEFAULT,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        variant == AppThemeVariant.PROSUMER -> ProsumerColorScheme
        else -> GridOperatorColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
