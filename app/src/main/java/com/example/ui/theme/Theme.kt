package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp

private val ForestDarkColorScheme = darkColorScheme(
    primary = ElderGold,
    onPrimary = DeepForestBg,
    primaryContainer = DeepBronze,
    onPrimaryContainer = SunlitAmber,
    secondary = EmeraldLeaf,
    onSecondary = DeepForestBg,
    secondaryContainer = MossCard,
    onSecondaryContainer = MistSage,
    tertiary = SunlitAmber,
    onTertiary = DeepForestBg,
    background = DeepForestBg,
    onBackground = MistSage,
    surface = CanopySurface,
    onSurface = MistSage,
    surfaceVariant = MossCard,
    onSurfaceVariant = MutedMoss,
    outline = SlateBorder,
    error = CrimsonAlert,
)

private val AppShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
)

@Composable
fun ShadowsOfTheAncientsTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = ForestDarkColorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
